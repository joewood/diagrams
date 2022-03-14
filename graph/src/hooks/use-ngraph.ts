import { groupBy, keyBy } from "lodash";
import createLayout, { Layout } from "ngraph.forcelayout";
import createGraph, { Link } from "ngraph.graph";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MiniGraphProps } from "../components/mini-graph";
import { NodeProps } from "../components/node";
import {
    GraphOptions,
    NGraph,
    NGraphLayout,
    PositionedNode, RequiredGraphOptions, ScreenRect, SimpleEdge,
    SimpleNode,
    Size,
    zeroPoint
} from "./model";

export function useChanged<T>(name: string, x: T) {
    useEffect(() => console.log(`${name} changed.`), [x, name]);
}

function updateBubblePositions(previousBubblePositions: Record<string, ScreenRect>, newPosSizes: ScreenRect[]) {
    if (!newPosSizes || newPosSizes.length === 0) return previousBubblePositions;
    const nextPosSizes = { ...previousBubblePositions };
    let anyDirty = false;
    for (const newPosSize of newPosSizes) {
        let dirty = false;
        // mark this as dirty if the item is missing
        dirty ||= !nextPosSizes[newPosSize.name];
        // skip if it's missing if we're in Overwrite Mode
        const nextPosSize = nextPosSizes[newPosSize.name] ?? {
            screenPosition: newPosSize.screenPosition,
            size: newPosSize.size,
            name: newPosSize.name,
        };
        const positionDifferent =
            nextPosSize.screenPosition.x !== newPosSize.screenPosition.x ||
            nextPosSize.screenPosition.y !== newPosSize.screenPosition.y;
        const sizeDifferent =
            nextPosSize.size.width !== newPosSize.size.width || nextPosSize.size.height !== newPosSize.size.height;
        dirty ||= positionDifferent;
        nextPosSize.screenPosition = newPosSize.screenPosition;
        dirty ||= sizeDifferent;
        nextPosSize.size = newPosSize.size;
        if (dirty) nextPosSizes[newPosSize.name] = nextPosSize;
        anyDirty ||= dirty;
    }
    if (anyDirty) return nextPosSizes;
    return previousBubblePositions;
}

export function useBubbledPositions(): [Record<string, ScreenRect>, MiniGraphProps["onBubblePositions"]] {
    const [trackPositions, setTrackPositions] = useState<Record<string, ScreenRect>>({});
    const onNodesPositioned = useCallback<MiniGraphProps["onBubblePositions"]>((posSizes) => {
        // console.log(`Nodes Local:${!!localMode} Positioned for ${name} : ${posSizes.length}`);
        setTrackPositions((prev) => updateBubblePositions(prev, posSizes));
    }, []);
    return [trackPositions, onNodesPositioned];
}

/** Simply group nodes by their parent, null means no parent */
export function useChildrenNodesByParent(simpleNodes: SimpleNode[]): Record<string, SimpleNode[]> {
    return useMemo<ReturnType<typeof useChildrenNodesByParent>>(() => {
        return groupBy(simpleNodes, (node) => node.parent ?? null);
    }, [simpleNodes]);
}

function useLayout(graph: NGraph, sizeOverrides: Record<string, Size>, options: RequiredGraphOptions): Layout<NGraph> {
    return useMemo(() => {
        // Do the LAYOUT
        const layout = createLayout(graph, options);
        // const overlapping = false;
        layout.forEachBody(
            (body, id) =>
                (body.mass =
                    50 *
                    (
                        sizeOverrides[id] ??
                        graph.getNode(id)?.data?.size ?? { width: options.defaultWidth, height: options.defaultHeight }
                    ).width *
                    (
                        sizeOverrides[id] ??
                        graph.getNode(id)?.data?.size ?? { width: options.defaultWidth, height: options.defaultHeight }
                    ).height) /
                (options.defaultWidth * options.defaultHeight)
        );
        for (let i = 0; i < options.iterations; ++i) {
            layout.step();
        }
        return layout;
    }, [graph, options, sizeOverrides]);
}

function getNodesFromLayout(
    nodesDict: Record<string, SimpleNode>,
    layout: NGraphLayout,
    options: Pick<RequiredGraphOptions, "defaultWidth" | "defaultHeight">
) {
    const layoutNodes: PositionedNode[] = [];
    layout.forEachBody((body, key) => {
        const simpleNode = nodesDict[key];
        if (!simpleNode) {
            return;
        }
        layoutNodes.push({
            ...simpleNode,
            body,
            size: simpleNode.size ?? { width: options.defaultWidth, height: options.defaultHeight },
            virtualPos: layout.getNodePosition(key),
            parentVirtualPosition: zeroPoint,
        });
    });
    return layoutNodes;
}

// /** Iterate over edges and create line structures */
// function getEdgesFromLayout(graph: NGraph, nodesDict: Record<string, PositionedNode>) {
//     const layoutEdges: PositionedEdge[] = [];
//     graph.forEachLink((link) => {
//         layoutEdges.push({
//             ...link.data,
//             from: link.fromId as string,
//             to: link.toId as string,
//             fromNode: nodesDict[link.fromId],
//             toNode: nodesDict[link.toId],
//             link,
//         });
//     });
//     return layoutEdges;
// }

function useCreateGraph(nodes: SimpleNode[], edges: SimpleEdge[]) {
    const { graph, allLinks } = useMemo(() => {
        const graph = createGraph({ multigraph: false });
        nodes.forEach((node) => {
            graph.addNode(node.name, node);
        });
        const allLinks: Link<SimpleEdge>[] = [];
        // Add links between nodes, using the aliases from above, which covers which nodes are expanded
        for (const edge of edges) {
            if (edge.from !== edge.to) {
                allLinks.push(graph.addLink(edge.from, edge.to, edge));
            }
        }
        return { graph, allLinks };
    }, [edges, nodes]);
    return { graph, allLinks };
}

export function useDefaultOptions(
    {
        defaultWidth,
        defaultHeight,
        iterations = 100,
        debugMassNode = false,
        textSize,
        gravity = -12,
        springCoefficient = 0.8,
        springLength = 10,
        theta = 0.8,
        dragCoefficient = 0.9,
        dimensions = 2,
        timeStep = 0.5,
        debug = false,
        titleHeight = 30,
        nodeMargin = 10,
        adaptiveTimeStepWeight = 0,
    }: GraphOptions,
    zoom = 1
) {
    return useMemo<RequiredGraphOptions>(
        () => ({
            defaultWidth: (defaultWidth ?? 100) * zoom,
            defaultHeight: (defaultHeight ?? 30) * zoom,
            iterations,
            debugMassNode,
            gravity,
            springCoefficient,
            springLength,
            theta,
            dragCoefficient,
            dimensions,
            timeStep,
            nodeMargin: nodeMargin * zoom,
            titleHeight: titleHeight * zoom,
            adaptiveTimeStepWeight,
            debug,
            textSize: (textSize ?? (defaultWidth ?? 100) / 12) * zoom,
        }),
        [
            adaptiveTimeStepWeight,
            debug,
            debugMassNode,
            defaultHeight,
            defaultWidth,
            dimensions,
            dragCoefficient,
            gravity,
            iterations,
            nodeMargin,
            springCoefficient,
            springLength,
            textSize,
            theta,
            timeStep,
            titleHeight,
            zoom,
        ]
    );
}

export function useSimpleGraph(
    nodes: SimpleNode[],
    edges: SimpleEdge[],
    sizeOverrides: Record<string, Size>,
    options: Pick<Required<GraphOptions>, "defaultWidth" | "defaultHeight" | "iterations">
): [PositionedNode[]/*, PositionedEdge[]*/] {
    const { graph } = useCreateGraph(nodes, edges);
    const _options = useDefaultOptions(options);
    const layout = useLayout(graph, sizeOverrides, _options);
    const nodesDict = useMemo(() => keyBy(nodes, (n) => n.name), [nodes]);
    return useMemo<ReturnType<typeof useSimpleGraph>>(() => {
        const positionedNodes = getNodesFromLayout(nodesDict, layout, options);
        // const positionedEdges = getEdgesFromLayout(
        //     graph,
        //     keyBy(positionedNodes, (node) => node.name)
        // );
        return [positionedNodes];
    }, [layout, options, nodesDict]);
}

/** Useful hook to handle onResizeNeeded for a graph. Simple size is tracked */
export function useGraphResize(
    name: string,
    existingSize: Size,
    onResizeNode: NodeProps["onResizeNode"],
    isExpanded: boolean | undefined
): MiniGraphProps["onResizeNeeded"] {
    useEffect(() => {
        if (!isExpanded) onResizeNode(name, null);
    }, [isExpanded, name, onResizeNode]);
    return useCallback<MiniGraphProps["onResizeNeeded"]>(
        (name, { suggestedSize }) => {
            if (suggestedSize.width === existingSize.width && suggestedSize.height === existingSize.height) return;
            onResizeNode(name, suggestedSize);
        },
        [existingSize.height, existingSize.width, onResizeNode]
    );
}
