import { useColorModeValue } from "@chakra-ui/react";
import { brewer, mix, scale } from "chroma-js";
import { keyBy, uniq } from "lodash";
import { useCallback, useMemo, useState } from "react";
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

// type ReuseMiniGraphProps = "onSelectNode" | "selectedNode" | "onExpandToggleNode" |"";
export function useExpandToggle(nodes: SimpleNode[]): [string[], Required<ExpandableGraphProps>["onExpandToggleNode"]] {
    const [expanded, setExpanded] = useState<string[]>([]);
    const nodesByParent = useChildrenNodesByParent(nodes);
    const onExpandToggleNode = useCallback<Required<ExpandableGraphProps>["onExpandToggleNode"]>(
        ({ name, expand }) => {
            setExpanded((previous) => {
                if (expand) return uniq([...previous, name]);
                const childrenNames = getAllChildrenName(name, nodesByParent);
                return previous.filter((e) => !childrenNames.includes(e));
            });
        },
        [nodesByParent]
    );
    return [expanded, onExpandToggleNode];
}

export function useSelectNodes(nodes: SimpleNode[]): [string[], Required<ExpandableGraphProps>["onSelectNode"]] {
    const [selectedNode, setSelectedNode] = useState<string[]>([]);
    const nodesByParent = useChildrenNodesByParent(nodes);
    const onSelectNode = useCallback<Required<ExpandableGraphProps>["onSelectNode"]>(
        ({ name, selected }) => {
            setSelectedNode((prev) => {
                const childrenNames = getAllChildrenName(name, nodesByParent);
                return !selected ? prev.filter((p) => !childrenNames.includes(p)) : uniq([...prev, ...childrenNames]);
            });
        },
        [nodesByParent]
    );
    return [selectedNode, onSelectNode];
}

export function useEdgeIn(nodes: SimpleNode[]): [string[], Required<ExpandableGraphProps>["onEdgeInNode"]] {
    const [edgeIn, setEdgeIn] = useState<string[]>([]);
    const nodesByParent = useChildrenNodesByParent(nodes);
    const onEdgeInToggle = useCallback<Required<ExpandableGraphProps>["onEdgeInNode"]>(
        ({ names, selected }) => {
            setEdgeIn((previous) => {
                if (selected) return uniq([...previous, ...names]);
                const childrenNames = getAllChildrenNames(names, nodesByParent);
                return previous.filter((e) => !childrenNames.includes(e));
            });
        },
        [nodesByParent]
    );
    return [edgeIn, onEdgeInToggle];
}

export function useEdgeOut(nodes: SimpleNode[]): [string[], Required<ExpandableGraphProps>["onEdgeOutNode"]] {
    const [edgeOut, setEdgeOut] = useState<string[]>([]);
    const nodesByParent = useChildrenNodesByParent(nodes);
    const onEdgeInToggle = useCallback<Required<ExpandableGraphProps>["onEdgeOutNode"]>(
        ({ names, selected }) => {
            setEdgeOut((previous) => {
                if (selected) return uniq([...previous, ...names]);
                const childrenNames = getAllChildrenNames(names, nodesByParent);
                return previous.filter((e) => !childrenNames.includes(e));
            });
        },
        [nodesByParent]
    );
    return [edgeOut, onEdgeInToggle];
}
