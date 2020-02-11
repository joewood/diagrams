import createGraph from 'ngraph.graph';
import l from "ngraph.forcelayout3d"
import { Layout, PositionedNode, PositionedEdge } from "./graph"
import { useMemo } from 'react';


interface Node {
    name: string;
}

interface Edge {
    from: string;
    to: string;
}
const ITERATIONS_COUNT = 100;


export function useNgraph(nodes: Node[], edges: Edge[]): Layout {
    const ret = useMemo(() => {
        var g = createGraph();
        for (const n of nodes) g.addNode(n.name, n);
        for (const e of edges) g.addLink(e.from, e.to, e)
        const layout = l(g);
        for (var i = 0; i < ITERATIONS_COUNT; ++i) {
            layout.step();
        }
        const retnodes: PositionedNode[] = nodes.map(n => ({ name: n.name, width: 10, height: 3, depth: 1, ...layout.getNodePosition(n.name) })) // .nodes().map(n => ({ name: n, width: g.node(n).width, height: g.node(n).height, x: g.node(n).x, y: g.node(n).y }));
        const retEdges: PositionedEdge[] = edges.map(e => ({ points: [layout.getNodePosition(e.from), layout.getNodePosition(e.to)] }))
        const { x1, x2, y1, y2, z1, z2, ...other } = layout.getGraphRect();
        console.log(`${z1} ${z2}`)
        return {
            nodes: retnodes, edges: retEdges,
            width: [x1, x2] as [number, number],
            height: [y1, y2] as [number, number],
            depth: [z1, z2] as [number, number]
        }
    }, [nodes, edges]);
    return ret;
}
