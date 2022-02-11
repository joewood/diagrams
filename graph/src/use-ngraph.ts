import { groupBy, keyBy, mapValues } from "lodash";
import createLayout, { Layout, Vector } from "ngraph.forcelayout";
import createGraph, { Link } from "ngraph.graph";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MiniGraphProps } from "./mini-graph";
import {
    ScreenPositionedNode,
    adjustPosition,
    getContainingRect,
    GraphOptions,
    NGraph,
    NGraphLayout,
    Point,
    PositionedEdge,
    PositionedNode,
    RequiredGraphOptions,
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
            const screenPosition = adjustPosition(
                node.position,
                parentVirtualPosition,
                parentVirtualSize,
                targetSize,
                targetPosition,
                padding
            );
            const topLeft = {x:screenPosition.x-node.size.width/2, y: screenPosition.y-node.size.height/2};
            return { ...node, screenPosition, parentScreenPosition: targetPosition, screenTopLeft: topLeft };
        });
        return [screenNodes, keyBy(screenNodes, (n) => n.name)];
    }, [nodes, padding, parentVirtualPosition, parentVirtualSize, targetPosition, targetSize]);
}

export function useEdges() {
    const [posEdges, setEdges] = useState<PositionedEdge[]>([]);
    const [posNodes, setNodes] = useState<Record<string, ScreenPositionedNode>>({});
    const onNodesMoved = useCallback<MiniGraphProps["onNodesPositioned"]>((name, edges, nodes) => {
        setEdges(edges);
        setNodes((nd) => {
            const x = { ...nd, ...nodes };
            return x;
        });
    }, []);
    return [posNodes, posEdges, onNodesMoved] as [
        Record<string, ScreenPositionedNode>,
        PositionedEdge[],
        MiniGraphProps["onNodesPositioned"]
    ];
}

/** Simply group nodes by their parent, null means no parent */
export function useChildrenNodesByParent(
    nodes: SimpleNode[],
    parentNode: Record<string, SimpleNode>,
    options: GraphOptions
): [Record<string, SimpleNode[]>, Record<string, SimpleNode>] {
    return useMemo<ReturnType<typeof useChildrenNodesByParent>>(() => {
        const nodesDict = keyBy(nodes, (n) => n.name);
        let childrenNodesByParent2 = groupBy(nodes, (node) => node.parent ?? null);
        const childrenNodesByParent = mapValues(childrenNodesByParent2, (v, k) =>
            v.map((node) => ({
                ...node,
                // initialSize: parentNode[k]?.size ?? options.defaultSize,
                // initialPosition: parentNode[k]?.position ?? { x: 0, y: 0 },
            }))
        );
        return [childrenNodesByParent, nodesDict];
    }, [nodes]);
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

//     if (l1.x > r2.x || l2.x > r1.x) {
//         return false;
//     }
//     if (l1.y > r2.y || l2.y > r1.y) {
//         return false;
//     }
//     return true;
// }

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
                    (graph.getNode(id)?.data?.size ?? options.defaultSize).height)
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
