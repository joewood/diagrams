import createGraph from "ngraph.graph";
import createLayout from "ngraph.forcelayout";
import { useMemo } from "react";
import { LayoutNode3, LayoutEdge3, Layout3, GraphNode3 } from "./model";
import { Vector3 } from "three";
import { GraphEdge, GraphNode, Size3 } from "./model";

interface GraphOptions {
    defaultSize?: Size3;
    iterations?: number;
}

export function useNgraph3D(
    nodes: GraphNode3[],
    edges: GraphEdge[],
    { defaultSize = { width: 200, height: 100, depth: 20 }, iterations = 100 }: GraphOptions
): Layout3 {
    const positioned = useMemo(() => {
        var graph = createGraph<GraphNode, GraphEdge>();
        for (const node of nodes) {
            graph.addNode(node.name, node);
        }
        for (const edge of edges) graph.addLink(edge.from, edge.to, edge);
        const layout = createLayout(graph, { dimensions: 3, gravity: -30 });
        for (const node of nodes) {
            if (!node.positionHint)
                layout.setNodePosition(node.name, Math.random() * 500, Math.random() * 500, Math.random() * 500);
        }

        for (let i = 0; i < iterations; ++i) {
            layout.step();
        }
        const returnedNodes: LayoutNode3[] = nodes.map((node) => {
            const { x, y, z } = layout.getNodePosition(node.name);
            return {
                name: node.name,
                size: node.size ?? defaultSize,
                position: { x, y, z },
                type: node.type || "basic",
            };
        });
        const retEdges: LayoutEdge3[] = edges.map((edge) => {
            const fromPos = layout.getNodePosition(edge.from);
            const toPos = layout.getNodePosition(edge.to);
            const fromNode = graph.getNode(edge.from)?.data!;
            const toNode = graph.getNode(edge.to)?.data!;

            const mid = (from: number, to: number, delta: number) => (to - from) * delta + from;

            // const connectPoint = (pos: Vector3, output: boolean) => {
            //     if (!output) return new Vector3(pos.x - toNode.width / 2, pos.y, pos.z);
            //     else return new Vector3(pos.x + fromNode.width / 2, pos.y, pos.z);
            // };

            // const midp = new Vector3(
            //     mid(fromPos.x, toPos.x, 0.5),
            //     mid(fromPos.y, toPos.y, 0.5),
            //     mid(fromPos.z, toPos.z, 0.5)
            // );
            // const fromPoint = connectPoint(new Vector3(fromPos.x, fromPos.y, fromPos.z), true);
            // const toPoint = connectPoint(new Vector3(toPos.x, toPos.y, toPos.z), false);
            // const fromHose = new Vector3(
            //     fromPoint.x + fromNode.width / 2,
            //     mid(fromPoint.y, toPoint.y, 0.1),
            //     mid(fromPoint.z, toPoint.z, 0.1)
            // );
            // const toHose = new Vector3(
            //     toPoint.x - toNode.width / 2,
            //     mid(fromPoint.y, toPoint.y, 0.9),
            //     mid(fromPoint.z, toPoint.z, 0.9)
            // );
            return {
                from: edge.from,
                to: edge.to,
                points: [], //fromPoint, fromHose, midp, toHose, toPoint],
            };
        });
        // TODO - raise issue the type is wrong in ngraph.layout
        const { min_x: x1, max_x: x2, min_y: y1, max_y: y2, min_z: z1, max_z: z2 } = layout.getGraphRect() as any;
        return {
            nodes: returnedNodes,
            edges: retEdges,
            minPoint: { x: x1, y: y1, z: z1 },
            maxPoint: { x: x2, y: y2, z: z2 },
        };
    }, [nodes, edges]);
    return positioned;
}
