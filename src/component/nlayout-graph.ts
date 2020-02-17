import createGraph from 'ngraph.graph';
import layout3d from "ngraph.forcelayout3d"
import { Layout, PositionedNode, PositionedEdge } from "./graph"
import { useMemo } from 'react';


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

        for (const e of edges) graph.addLink(e.from, e.to, e)
        const layout = layout3d(graph);
        for (let i = 0; i < ITERATIONS_COUNT; ++i) {
            layout.step();
        }
        const retnodes: PositionedNode[] = nodes.map(n => ({ name: n.name, width: 10, height: 3, depth: 1, ...layout.getNodePosition(n.name) }))
        const retEdges: PositionedEdge[] = edges.map(e => ({ points: [layout.getNodePosition(e.from), layout.getNodePosition(e.to)] }))
        const { x1, x2, y1, y2, z1, z2, ...other } = layout.getGraphRect();
        // console.log(`${z1} ${z2}`)
        return {
            nodes: retnodes, edges: retEdges,
            width: [x1, x2] as [number, number],
            height: [y1, y2] as [number, number],
            depth: [z1, z2] as [number, number]
        }
    }, [nodes, edges]);
    return positioned;
}
