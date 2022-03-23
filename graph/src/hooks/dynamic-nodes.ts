import { useColorModeValue } from "@chakra-ui/react";
import { brewer, mix, scale } from "chroma-js";
import { SVGMotionProps } from "framer-motion";
import { keyBy, uniq } from "lodash";
import { SVGProps, useCallback, useEffect, useMemo, useState } from "react";
import { MiniGraphProps } from "..";
import { ExpandableGraphProps } from "../expandable-graph";
import { SimpleNode } from "./model";
import { useChildrenNodesByParent } from "./use-ngraph";

const palette = brewer.RdYlGn;
const paletteScale = scale(palette);

export function getVisibleNode(
    node: SimpleNode,
    leafNodes: Record<string, SimpleNode>,
    nodesDict: Record<string, SimpleNode>,
    expanded: string[]
) {
    while (!!node && node.parent !== null && !(leafNodes[node.name] || expanded.includes(node.parent))) {
        node = nodesDict[node.parent ?? null];
    }
    return node;
}

/** recurse through parents to get the color of the node */
function getNodeColor(nodeDict: Record<string, SimpleNode>, node: SimpleNode, blend: string): string {
    const parentColor =
        node?.color ?? (!node || !node.parent ? "#888" : getNodeColor(nodeDict, nodeDict[node.parent], blend));
    return mix(parentColor, blend, 0.2).css();
}

export function useDefaultNodes(simpleNodes: SimpleNode[]) {
    const blend = useColorModeValue("white", "black");
    return useMemo(() => {
        const numberParent = simpleNodes.filter((node) => !node.parent).length;
        let index = 0;
        const topColors = simpleNodes.map((node) => ({
            ...node,
            color: node.color ?? (node.parent ? undefined : paletteScale(index++ / numberParent).css()),
        }));
        const nodesDict = keyBy(topColors, (p) => p.name);
        return topColors.map((node) => ({
            ...node,
            color: node.color ?? getNodeColor(nodesDict, node, blend),
        }));
    }, [blend, simpleNodes]);
}

export function getAllChildrenName(n: string, nodesByParent: Record<string, SimpleNode[]>): string[] {
    return [n, ...(nodesByParent[n]?.flatMap((p) => getAllChildrenName(p.name, nodesByParent)) ?? [])];
}

export function getAllChildrenNames(names: string[], nodesByParent: Record<string, SimpleNode[]>): string[] {
    return [
        ...names,
        ...names.flatMap(
            (name) => nodesByParent[name]?.flatMap((node) => getAllChildrenName(node.name, nodesByParent)) ?? []
        ),
    ];
}

function useSearchParamsArray(
    field: string,
    useSearchParams = true
): [string[], (value: (v: string[]) => string[]) => void] {
    const href = (typeof window === "undefined" || !useSearchParams) ? undefined : window.location.href;
    const url = useMemo(() => (!href ? undefined : new URL(href)), [href]);
    const [exp, setExp] = useState<string[]>(url?.searchParams?.getAll(field) ?? []);
    const setValue = useCallback(
        (cb: (oldVal: string[]) => string[]) => {
            const oldArray = url?.searchParams?.getAll(field) ?? [];
            const newVal = cb(oldArray);
            if (!url) return newVal;
            setExp(newVal);
            url.searchParams.delete(field);
            for (const v of newVal) {
                if (url.searchParams.get(field) === null) url.searchParams.set(field, v);
                else url.searchParams.append(field, v);
            }
            window.history.replaceState(null, "", url); // or pushState
        },
        [field, url]
    );
    return [exp, setValue];
}

export function useExpandToggle(nodes: SimpleNode[]): [string[], Required<ExpandableGraphProps>["onExpandToggleNode"]] {
    const [expanded, setExpanded] = useSearchParamsArray("expanded");
    const nodesByParent = useChildrenNodesByParent(nodes);
    const onExpandToggleNode = useCallback<Required<ExpandableGraphProps>["onExpandToggleNode"]>(
        ({ name, expand }) => {
            setExpanded((previous) => {
                if (expand) return uniq([...previous, name]);
                const childrenNames = getAllChildrenName(name, nodesByParent);
                return previous.filter((e) => !childrenNames.includes(e));
            });
        },
        [nodesByParent, setExpanded]
    );
    return [expanded, onExpandToggleNode];
}

export function useSelectNodes(nodes: SimpleNode[]): [string[], Required<ExpandableGraphProps>["onSelectNode"]] {
    const [selectedNode, setSelectedNode] = useSearchParamsArray("select");
    const nodesByParent = useChildrenNodesByParent(nodes);
    const onSelectNode = useCallback<Required<ExpandableGraphProps>["onSelectNode"]>(
        ({ name, selected }) => {
            setSelectedNode((prev) => {
                const childrenNames = getAllChildrenName(name, nodesByParent);
                return !selected ? prev.filter((p) => !childrenNames.includes(p)) : uniq([...prev, ...childrenNames]);
            });
        },
        [nodesByParent, setSelectedNode]
    );
    return [selectedNode, onSelectNode];
}

export function useFilterEdges(nodes: SimpleNode[]): [string[], Required<ExpandableGraphProps>["onFilterEdges"]] {
    const [edgeIn, setEdgeIn] = useSearchParamsArray("filter");
    const nodesByParent = useChildrenNodesByParent(nodes);
    const onEdgeInToggle = useCallback<Required<ExpandableGraphProps>["onFilterEdges"]>(
        ({ names, include }) => {
            setEdgeIn((previous) => {
                if (include) return uniq([...previous, ...names]);
                const childrenNames = getAllChildrenNames(names, nodesByParent);
                return previous.filter((e) => !childrenNames.includes(e));
            });
        },
        [nodesByParent, setEdgeIn]
    );
    return [edgeIn, onEdgeInToggle];
}

export function useHoverMotion<T extends SVGElement = SVGGElement>(): [
    boolean,
    {
        onMouseEnter: SVGMotionProps<T>["onMouseEnter"];
        onMouseLeave: SVGMotionProps<T>["onMouseLeave"];
    }
] {
    const [hover, setHover] = useState(false);
    const onMouseEnter = useCallback(() => setHover(true), []);
    const onMouseLeave = useCallback(() => setHover(false), []);
    return [hover, { onMouseEnter, onMouseLeave }];
}

export function useHoverMotion2<T extends SVGElement = SVGGElement>(): [
    boolean,
    {
        onMouseEnter: SVGProps<T>["onMouseEnter"];
        onMouseLeave: SVGProps<T>["onMouseLeave"];
    }
] {
    const [hover, setHover] = useState(false);
    const onMouseEnter = useCallback(() => setHover(true), []);
    const onMouseLeave = useCallback(() => setHover(false), []);
    return [hover, { onMouseEnter, onMouseLeave }];
}



export function useHover<T extends SVGElement = SVGGElement>(): [
    boolean,
    {
        onmouseenter: T["onmouseenter"];
        onmouseleave: T["onmouseleave"];
    }
] {
    const [hover, setHover] = useState(false);
    const onmouseenter = useCallback(() => setHover(true), []);
    const onmouseleave = useCallback(() => setHover(false), []);
    return [hover, { onmouseenter, onmouseleave }];
}

export function getAllChildNodes(onGetSubGraph: MiniGraphProps["onGetSubgraph"], nodeName: string): string[] {
    return (
        onGetSubGraph?.(nodeName)?.flatMap((node) => [node.name, ...getAllChildNodes(onGetSubGraph, node.name)]) ?? []
    );
}
