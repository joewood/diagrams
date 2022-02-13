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

export function useChanged<T>(name: string, x: T) {
    useEffect(() => console.log(`${name} changed.`), [x, name]);
}

export function useScreenNodes(
    nodes: PositionedNode[],
    parentVirtualPosition: Point,
    parentVirtualSize: Size,
    targetSize: Size,
    targetPosition: Point,
    padding: number
): [ScreenPositionedNode[], Record<string, ScreenPositionedNode>] {
    return useMemo<ReturnType<typeof useScreenNodes>>(() => {
        const screenNodes = nodes.map((node) => {
            // console.log(node.name + " Nod Position", node.position);
            // console.log(node.name + " Nod Parent Virtual Pos", parentVirtualPosition);
            // console.log(node.name + " Nod Virtual Size", parentVirtualSize);
            // console.log(node.name + " Nod target Pos", targetPosition);

            const screenPosition = adjustPosition(
                node.position,
                parentVirtualPosition,
                parentVirtualSize,
                targetSize,
                targetPosition,
                padding
            );
            return {
                ...node,
                screenPosition,
                parentScreenPosition: targetPosition,
                // screenTopLeft: topLeft,
            };
        });
        return [screenNodes, keyBy(screenNodes, (n) => n.name)];
    }, [nodes, padding, parentVirtualPosition, parentVirtualSize, targetPosition, targetSize]);
}

export type PosSize = { name: string; screenPosition: Point; size: Size };

function updatePosSize(
    trackPositions: Record<string, PosSize>,
    posSizes: PosSize[],
    dontAdd: boolean,
    initial: boolean
) {
    if (!posSizes || posSizes.length === 0) return trackPositions;
    const newTracker = { ...trackPositions };
    let anyDirty = false;
    for (const posSize of posSizes) {
        let dirty = false;
        if (posSize.name === "Data") {
            console.log("UPDATING DATA SIZE: " + JSON.stringify(posSize.size));
        }
        dirty ||= !dontAdd && !newTracker[posSize.name];
        if (dontAdd && dirty) continue;
        const mod = newTracker[posSize.name] ?? {
            screenPosition: posSize.screenPosition,
            size: posSize.size,
            name: posSize.name,
        };
        dirty ||=
            mod.screenPosition.x !== posSize.screenPosition.x || mod.screenPosition.y !== posSize.screenPosition.y;
        mod.screenPosition = posSize.screenPosition;
        if (!initial) {
            dirty ||= mod.size.width !== posSize.size.width || mod.size.height !== posSize.size.height;
            mod.size = posSize.size;
        }
        if (dirty) newTracker[posSize.name] = mod;
        // if (dirty) console.log(`DIRTY NODE ${name}: ${posSize.name} is dirty: ${JSON.stringify(posSize)}`);
        anyDirty ||= dirty;
    }
    console.log("DATA SIZE IN STATE " + JSON.stringify(newTracker["Data"]), anyDirty);
    if (anyDirty) return newTracker;
    return trackPositions;
}

export function useScreenPositionTracker(
    newPosSizes: ScreenPositionedNode[],
    name: string /* logging */
): [Record<string, PosSize>, Record<string, PosSize>, MiniGraphProps["onNodesPositioned"]] {
    const [trackPositions, setTrackPositions] = useState<Record<string, PosSize>>(
        keyBy(
            newPosSizes.map(({ name, screenPosition, size }) => ({ name, screenPosition, size })),
            (k) => k.name
        )
    );
    const [localTrackPositions, setLocalTrackPositions] = useState<Record<string, PosSize>>(
        keyBy(
            newPosSizes.map(({ name, screenPosition, size }) => ({ name, screenPosition, size })),
            (k) => k.name
        )
    );

    const onNodesPositioned = useCallback<MiniGraphProps["onNodesPositioned"]>((posSizes) => {
        console.log("Nodes Posed " + posSizes.length);
        setTrackPositions((prev) => updatePosSize(prev, posSizes, false, false));
        setLocalTrackPositions((prev) => updatePosSize(prev, posSizes, true, false));
    }, []);
    // update the trackPositions only if the screenNodes changed
    useEffect(() => {
        setTrackPositions((old) => updatePosSize(old, newPosSizes, false, true));
        setLocalTrackPositions((old) => updatePosSize(old, newPosSizes, false, true));
    }, [newPosSizes]);
    return [localTrackPositions, trackPositions, onNodesPositioned];
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

function useLayout(graph: NGraph, options: RequiredGraphOptions): Layout<NGraph> & { overlapping: boolean } {
    return useMemo(() => {
        // Do the LAYOUT
        const layout = createLayout(graph, options);
        const overlapping = false;
        layout.forEachBody(
            (body, id) =>
                (body.mass =
                    50 *
                    (graph.getNode(id)?.data?.size ?? options.defaultSize).width *
                    (graph.getNode(id)?.data?.size ?? options.defaultSize).height) /
                (options.defaultSize.width * options.defaultSize.height)
        );
        // const qt = new QuadTree(new Box(0, 0, 1000, 1000));
        // graph.forEachNode((n) => {
        //     const body = layout.getBody(n.id);
        //     if (body) qt.insert(getPointsFromBox(body.pos.x, body.pos.y, n.data.size.width, n.data.size.height));
        // });
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
    }, [graph, options]);
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

export function useContainingRect(targetArea: Size, positionedNodes: PositionedNode[], textSize: number) {
    // get the containing rectangle
    return useMemo(
        () => getContainingRect(positionedNodes, targetArea, textSize),
        [targetArea, positionedNodes, textSize]
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
    options: Pick<Required<GraphOptions>, "defaultSize" | "iterations">
): [PositionedNode[], PositionedEdge[], boolean] {
    const { graph } = useCreateGraph(nodes, edges);
    const _options = useDefaultOptions(options);
    const layout = useLayout(graph, _options);
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
    initialSize: Size | undefined,
    defaultSize: Size,
    expanded: boolean|undefined
): [Size | undefined, Required<MiniGraphProps>["onResizeNeeded"]] {
    const [graphSize, setGraphSize] = useState(initialSize);
    useEffect(() => {
        if (!expanded) setGraphSize(undefined);
    }, [expanded]);
    const onResizeGraph = useCallback(
        (name: string, overlapping: boolean, shrinking: boolean) => {
            setGraphSize((old) => {
                console.log(`Expanding: ${name} ${overlapping} ${shrinking} - ` + JSON.stringify(old));
                return {
                    width: (old ?? defaultSize).width * (overlapping ? 1.1 : shrinking ? 0.9 : 1),
                    height: (old ?? defaultSize).height * (overlapping ? 1.1 : shrinking ? 0.9 : 1),
                };
            });
        },
        [defaultSize]
    );
    return [graphSize, onResizeGraph];
}
