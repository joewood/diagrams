import { groupBy, keyBy } from "lodash";
import createLayout, { Layout, Vector } from "ngraph.forcelayout";
import createGraph, { Link } from "ngraph.graph";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MiniGraphProps } from "./mini-graph";
import {
    adjustPosition,
    getContainingRect,
    GraphOptions,
    NGraph,
    NGraphLayout,
    Point,
    PositionedEdge,
    PositionedNode,
    RequiredGraphOptions,
    ScreenPositionedNode,
    SimpleEdge,
    SimpleNode,
    Size,
    zeroPoint,
} from "./model";
import { NodeProps } from "./node";

export function useChanged<T>(name: string, x: T) {
    useEffect(() => console.log(`${name} changed.`), [x, name]);
}

export function useScreenNodes(
    nodes: PositionedNode[],
    parentVirtualPosition: Point,
    parentVirtualSize: Size,
    r:number,
    targetSize: Size,
    targetPosition: Point,
    sizeOverrides: Record<string, Size>,
    padding: number
): [ScreenPositionedNode[], Record<string, ScreenPositionedNode>] {
    return useMemo<ReturnType<typeof useScreenNodes>>(() => {
        const screenNodes = nodes.map((node) => {
            const screenPosition = adjustPosition(
                node.position,
                parentVirtualPosition,
                parentVirtualSize,
                r,
                targetSize,
                targetPosition,
                padding
            );
            return {
                ...node,
                screenPosition,
                parentScreenPosition: targetPosition,
                size: sizeOverrides[node.name] ?? node.size,
            };
        });
        return [screenNodes, keyBy(screenNodes, (n) => n.name)];
    }, [nodes, padding, parentVirtualPosition, parentVirtualSize, r, sizeOverrides, targetPosition, targetSize]);
}

export type PosSize = { name: string; screenPosition: Point; size: Size };

function updatePosSizes(previousPosSizes: Record<string, PosSize>, newPosSizes: PosSize[]) {
    if (!newPosSizes || newPosSizes.length === 0) return previousPosSizes;
    const nextPosSizes = { ...previousPosSizes };
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
    return previousPosSizes;
}

export function useBubbledPositions(): [Record<string, PosSize>, MiniGraphProps["onBubblePositions"]] {
    const [trackPositions, setTrackPositions] = useState<Record<string, PosSize>>({});
    const onNodesPositioned = useCallback<MiniGraphProps["onBubblePositions"]>((posSizes) => {
        // console.log(`Nodes Local:${!!localMode} Positioned for ${name} : ${posSizes.length}`);
        setTrackPositions((prev) => updatePosSizes(prev, posSizes));
    }, []);
    return [trackPositions, onNodesPositioned];
}

/** Simply group nodes by their parent, null means no parent */
export function useChildrenNodesByParent(simpleNodes: SimpleNode[]): Record<string, SimpleNode[]> {
    return useMemo<ReturnType<typeof useChildrenNodesByParent>>(() => {
        return groupBy(simpleNodes, (node) => node.parent ?? null);
    }, [simpleNodes]);
}

export function rectanglesOverlap(topLeft1: Point, bottomRight1: Point, topLeft2: Point, bottomRight2: Point) {
    // To check if either rectangle is actually a line
    // For example : l1 ={-1,0} r1={1,1} l2={0,-1} r2={0,1}
    if (
        topLeft1.x === bottomRight1.x ||
        topLeft1.y === bottomRight1.y ||
        topLeft2.x === bottomRight2.x ||
        topLeft2.y === bottomRight2.y
    ) {
        // the line cannot have positive overlap
        return false;
    }
    // If one rectangle is on left side of other
    if (topLeft1.x >= bottomRight2.x || topLeft2.x >= bottomRight1.x) {
        return false;
    }
    // If one rectangle is above other
    if (bottomRight1.y <= topLeft2.y || bottomRight2.y <= topLeft1.y) {
        return false;
    }
    return true;
}

function useLayout(
    graph: NGraph,
    sizeOverrides: Record<string, Size>,
    options: RequiredGraphOptions
): Layout<NGraph> & { overlapping: boolean } {
    return useMemo(() => {
        // Do the LAYOUT
        const layout = createLayout(graph, options);
        const overlapping = false;
        layout.forEachBody(
            (body, id) =>
                (body.mass =
                    50 *
                    (sizeOverrides[id] ?? graph.getNode(id)?.data?.size ?? options.defaultSize).width *
                    (sizeOverrides[id] ?? graph.getNode(id)?.data?.size ?? options.defaultSize).height) /
                (options.defaultSize.width * options.defaultSize.height)
        );
        for (let i = 0; i < options.iterations; ++i) {
            const oldPos: Record<string, Vector> = {};
            graph.forEachNode((n) => {
                const body = layout.getBody(n.id);
                if (!body) return;
                oldPos[n.id] = body?.pos;
            });
            layout.step();
        }
        return { ...layout, overlapping };
    }, [graph, options, sizeOverrides]);
}

function getNodesFromLayout(
    nodesDict: Record<string, SimpleNode>,
    layout: NGraphLayout,
    options: Pick<RequiredGraphOptions, "defaultSize">
) {
    const layoutNodes: PositionedNode[] = [];
    layout.forEachBody((body, key) => {
        const simpleNode = nodesDict[key];
        if (!simpleNode) {
            console.log(`Found ${key} but not in dict ${nodesDict}`);
            return;
        }
        layoutNodes.push({
            ...simpleNode,
            body,
            size: simpleNode.size ?? options.defaultSize,
            position: layout.getNodePosition(key),
            backgroundColor: simpleNode.backgroundColor,
            parentVirtualPosition: zeroPoint,
        });
    });
    return layoutNodes;
}

/** Iterate over edges and create line structures */
function getEdgesFromLayout(graph: NGraph, nodesDict: Record<string, PositionedNode>) {
    const layoutEdges: PositionedEdge[] = [];
    graph.forEachLink((link) => {
        layoutEdges.push({
            ...link.data,
            from: link.fromId as string,
            to: link.toId as string,
            fromNode: nodesDict[link.fromId],
            toNode: nodesDict[link.toId],
            link,
        });
    });
    return layoutEdges;
}

export function useContainingRect(
    targetArea: Size,
    positionedNodes: PositionedNode[],
    sizeOverride: Record<string, Size>,
    textSize: number
) {
    // get the containing rectangle
    return useMemo(
        () => getContainingRect(positionedNodes, targetArea, sizeOverride, textSize),
        [positionedNodes, targetArea, sizeOverride, textSize]
    );
}

function useCreateGraph(nodes: SimpleNode[], edges: SimpleEdge[]) {
    const { graph, allLinks } = useMemo(() => {
        console.log("Creating Graph");
        const graph = createGraph({ multigraph: true });
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

export function useDefaultOptions({
    defaultSize,
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
    adaptiveTimeStepWeight = 0,
}: GraphOptions) {
    return useMemo<RequiredGraphOptions>(
        () => ({
            defaultSize: defaultSize ?? { width: 100, height: 80 },
            iterations,
            debugMassNode,
            gravity,
            springCoefficient,
            springLength,
            theta,
            dragCoefficient,
            dimensions,
            timeStep,
            adaptiveTimeStepWeight,
            debug,
            textSize: textSize ?? (defaultSize?.width ?? 100) / 12,
        }),
        [
            adaptiveTimeStepWeight,
            debug,
            debugMassNode,
            defaultSize,
            dimensions,
            dragCoefficient,
            gravity,
            iterations,
            springCoefficient,
            springLength,
            textSize,
            theta,
            timeStep,
        ]
    );
}

export function useSimpleGraph(
    nodes: SimpleNode[],
    edges: SimpleEdge[],
    sizeOverrides: Record<string, Size>,
    options: Pick<Required<GraphOptions>, "defaultSize" | "iterations">
): [PositionedNode[], PositionedEdge[], boolean] {
    const { graph } = useCreateGraph(nodes, edges);
    const _options = useDefaultOptions(options);
    const layout = useLayout(graph, sizeOverrides, _options);
    const nodesDict = useMemo(() => keyBy(nodes, (n) => n.name), [nodes]);
    return useMemo<ReturnType<typeof useSimpleGraph>>(() => {
        const positionedNodes = getNodesFromLayout(nodesDict, layout, options);
        const positionedEdges = getEdgesFromLayout(
            graph,
            keyBy(positionedNodes, (node) => node.name)
        );
        return [positionedNodes, positionedEdges, layout.overlapping];
    }, [graph, layout, options, nodesDict]);
}

/** Useful hook to handle onResizeNeeded for a graph. Simple size is tracked */
export function useGraphResize(
    name: string,
    existingSize: Size,
    onResizeNode: NodeProps["onResizeNode"],
    expanded: boolean | undefined
): Required<MiniGraphProps>["onResizeNeeded"] {
    useEffect(() => {
        if (!expanded) onResizeNode(name, null);
    }, [expanded, name, onResizeNode]);
    return useCallback<Required<MiniGraphProps>["onResizeNeeded"]>(
        (name: string, overlapping: boolean, shrinking: boolean) => {
            // console.log(`Expanding: ${name} ${overlapping} ${shrinking} - ` + JSON.stringify(existingSize));
            onResizeNode(name, {
                width: existingSize.width * (overlapping ? 1.1 : shrinking ? 0.9 : 1),
                height: existingSize.height * (overlapping ? 1.1 : shrinking ? 0.9 : 1),
            });
        },
        [existingSize, onResizeNode]
    );
}
