import createGraph from "ngraph.graph";
import layout3d from "ngraph.forcelayout3d";
import { useMemo } from "react";
import { PositionedNode, PositionedEdge, Layout, MinMax } from "./use-graph-viewport";
import { Vector3 } from "three";

interface Node {
    name: string;
    x?: number;
    y?: number;
    z?: number;
    width: number;
    height: number;
    depth: number;
}

interface Edge {
    from: string;
    to: string;
}
const ITERATIONS_COUNT = 100;

export function useNgraph(nodes: Node[], edges: Edge[]): Layout {
    const positioned = useMemo(() => {
        var graph = createGraph<Node, Edge>();
        for (const n of nodes) {
            graph.addNode(n.name, n);
        }
        for (const e of edges) graph.addLink(e.from, e.to, e);
        const layout = layout3d(graph, { gravity: -30 });
        for (const n of nodes) {
            if (n.x !== undefined || n.y !== undefined || n.z !== undefined)
                layout.setNodePosition(n.name, -10 * (n.x || 10), n.y || Math.random() * 500, n.z || 0);
        }

        for (let i = 0; i < ITERATIONS_COUNT; ++i) {
            layout.step();
        }
        const retnodes: PositionedNode[] = nodes.map(n => {
            const { x, y, z } = layout.getNodePosition(n.name);
            return {
                name: n.name,
                width: n.width,
                height: n.height,
                depth: n.depth,
                position: new Vector3(x, y, z)
            };
        });
        const retEdges: PositionedEdge[] = edges.map(e => {
            const fromPos = layout.getNodePosition(e.from);
            const toPos = layout.getNodePosition(e.to);
            const fromNode = graph.getNode(e.from)?.data!;
            const toNode = graph.getNode(e.to)?.data!;

            const mid = (from: number, to: number, delta: number) => (to - from) * delta + from;

            const connectPoint = (pos: Vector3, output: boolean) => {
                if (!output) return new Vector3(pos.x - toNode.width / 2, pos.y, pos.z);
                else return new Vector3(pos.x + fromNode.width / 2, pos.y, pos.z);
            };

            const midp = new Vector3(
                mid(fromPos.x, toPos.x, 0.5),
                mid(fromPos.y, toPos.y, 0.5),
                mid(fromPos.z, toPos.z, 0.5)
            );
            const fromPoint = connectPoint(new Vector3(fromPos.x, fromPos.y, fromPos.z), true);
            const toPoint = connectPoint(new Vector3(toPos.x, toPos.y, toPos.z), false);
            const fromHose = new Vector3(
                fromPoint.x + fromNode.width / 2,
                mid(fromPoint.y, toPoint.y, 0.1),
                mid(fromPoint.z, toPoint.z, 0.1)
            );
            const toHose = new Vector3(
                toPoint.x - toNode.width / 2,
                mid(fromPoint.y, toPoint.y, 0.9),
                mid(fromPoint.z, toPoint.z, 0.9)
            );
            return {
                from: e.from,
                to: e.to,
                points: [fromPoint, fromHose, midp, toHose, toPoint]
            };
        });
        const { x1, x2, y1, y2, z1, z2 } = layout.getGraphRect();
        return {
            nodes: retnodes,
            edges: retEdges,
            width: [x1, x2] as MinMax,
            height: [y1, y2] as MinMax,
            depth: [z1, z2] as MinMax
        };
    }, [nodes, edges]);
    return positioned;
}
