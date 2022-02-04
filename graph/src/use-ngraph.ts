import { groupBy, keyBy } from "lodash";
import createLayout, { Vector } from "ngraph.forcelayout";
import createGraph, { Link } from "ngraph.graph";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MiniGraphProps } from "./mini-graph";
import {
    getContainingRect,
    GraphOptions,
    HierarchicalNode,
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

export type AbsolutePositionedNode = PositionedNode & {
    absolutePosition: Point;
};

export function useEdges() {
    const [posEdges, setEdges] = useState<PositionedEdge[]>([]);
    const [posNodes, setNodes] = useState<Record<string, AbsolutePositionedNode>>({});
    const onNodesMoved = useCallback<MiniGraphProps["onNodesPositioned"]>((edges, nodes) => {
        setEdges(edges);
        setNodes((nd) => {
            const x = { ...nd, ...nodes };
            return x;
        });
    }, []);
    return [posNodes, posEdges, onNodesMoved] as [
        Record<string, AbsolutePositionedNode>,
        PositionedEdge[],
        MiniGraphProps["onNodesPositioned"]
    ];
}

/** Simply group nodes by their parent, null means no parent */
export function useChildrenNodesByParent(nodes: HierarchicalNode[]) {
    const childrenNodesByParent = useMemo<Record<string, HierarchicalNode[]>>(
        () => groupBy(nodes, (node) => node.parent),
        [nodes]
    );
    const nodesDict = keyBy(nodes, (n) => n.name);
    return [childrenNodesByParent, nodesDict] as [Record<string, HierarchicalNode[]>, Record<string, HierarchicalNode>];
}

function rectanglesOverlap(topLeft1: Point, bottomRight1: Point, topLeft2: Point, bottomRight2: Point) {
    if (topLeft1.x > bottomRight2.x || topLeft2.x > bottomRight1.x) {
        return false;
    }
    if (topLeft1.y > bottomRight2.y || topLeft2.y > bottomRight1.y) {
        return false;
    }
    return true;
}

function useLayout(graph: NGraph, options: RequiredGraphOptions) {
    return useMemo(() => {
        // Do the LAYOUT
        const layout = createLayout(graph, options);
        layout.forEachBody(
            (body, id) => (body.mass = 50 * (graph.getNode(id)?.data?.size ?? options.defaultSize).width)
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
            graph.forEachNode((node1) => {
                const body1 = layout.getBody(node1.id);
                if (!body1 || !node1 || !node1.data || !node1.data.size) return;
                const staticRect = {
                    x: body1?.pos.x,
                    y: body1?.pos.y,
                    width: node1?.data?.size.width,
                    height: node1?.data?.size.height,
                };
                graph.forEachNode((testNode) => {
                    const body2 = layout.getBody(testNode.id);
                    if (!body2 || !testNode || !testNode.data || !testNode.data.size) return;
                    const testRect = {
                        x: body2?.pos.x,
                        y: body2?.pos.y,
                        width: testNode?.data?.size.width,
                        height: testNode?.data?.size.height,
                    };
                    if (
                        rectanglesOverlap(
                            { x: staticRect.x, y: staticRect.y },
                            { x: staticRect.x + staticRect.width, y: staticRect.y + staticRect.height },
                            { x: testRect.x, y: testRect.y },
                            { x: testRect.x + testRect.width, y: testRect.y + testRect.height }
                        )
                    ) {
                        const newPos = { x: testRect.x, y: testRect.y };
                        if (
                            testRect.x + testRect.width > staticRect.x &&
                            testRect.x + testRect.width < staticRect.x + staticRect.width
                        ) {
                            newPos.x = oldPos[testNode.id].x;
                            body2.velocity = { x: 0, y: body2.velocity.y };
                        }
                        if (
                            testRect.y + testRect.height > staticRect.y &&
                            testRect.y + testRect.height < staticRect.y + staticRect.height
                        ) {
                            newPos.y = oldPos[testNode.id].y;
                            body2.velocity = { x: body2.velocity.x, y: 0 };
                        }
                        testRect.x = newPos.x;
                        testRect.y = newPos.y;
                    }
                });
            });
        }
        return layout;
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
            console.warn(`Found ${key} but not in dict ${nodesDict}`);
            return;
        }
        layoutNodes.push({
            ...simpleNode,
            body,
            size: simpleNode.size ?? options.defaultSize,
            position: layout.getNodePosition(key),
            backgroundColor: simpleNode.backgroundColor,
            containerPosition: zeroPoint,
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
        () => getContainingRect(positionedNodes, targetArea, textSize * 2),
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
): [PositionedNode[], PositionedEdge[]] {
    const { graph } = useCreateGraph(nodes, edges);
    const _options = useDefaultOptions(options);
    const layout = useLayout(graph, _options);
    const nodesDict = useMemo(() => keyBy(nodes, (n) => n.name), [nodes]);
    return useMemo<[PositionedNode[], PositionedEdge[]]>(() => {
        const positionedNodes = getNodesFromLayout(nodesDict, layout, options);
        const positionedEdges = getEdgesFromLayout(
            graph,
            keyBy(positionedNodes, (node) => node.name)
        );
        return [positionedNodes, positionedEdges];
    }, [graph, layout, options, nodesDict]);
}
