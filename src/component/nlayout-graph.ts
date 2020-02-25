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
}

interface Edge {
    from: string;
    to: string;
}
const ITERATIONS_COUNT = 100;

export function useNgraph(nodes: Node[], edges: Edge[]): Layout {
    const positioned = useMemo(() => {
        var graph = createGraph();
        for (const n of nodes) graph.addNode(n.name, n);

        for (const e of edges) graph.addLink(e.from, e.to, e);
        const layout = layout3d(graph);
        for (let i = 0; i < ITERATIONS_COUNT; ++i) {
            layout.step();
        }
        const retnodes: PositionedNode[] = nodes.map(n => {
            const { x, y, z } = layout.getNodePosition(n.name);
            return { name: n.name, width: 10, height: 3, depth: 1, position: new Vector3(x, y, z) };
        });
        const retEdges: PositionedEdge[] = edges.map(e => {
            const fromPos = layout.getNodePosition(e.from);
            const toPos = layout.getNodePosition(e.to);
            return {
                from: e.from,
                to: e.to,
                points: [new Vector3(fromPos.x, fromPos.y, fromPos.z), new Vector3(toPos.x, toPos.y, toPos.z)]
            };
        });
        const { x1, x2, y1, y2, z1, z2, ...other } = layout.getGraphRect();
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
