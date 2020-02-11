import { graphlib, layout } from "dagre"
import { useMemo } from 'react'
import { Layout } from "./graph"

export interface Node {
    name: string;
    width: number;
    height: number;
}

export interface Edge {
    from: string;
    to: string;
    messages?: number;
    weight?: number;
}

export function useDag(nodes: Node[], edges: Edge[], direction = "LR"): Layout {
    return useMemo<Layout>(() => {
        const g = new graphlib.Graph({ directed: true });
        g.setGraph({ edgesep: 2, marginx: 20, marginy: 20, rankdir: "LR" });
        g.setDefaultEdgeLabel(() => { return {} });
        for (const node of nodes) {
            g.setNode(node.name, { label: node.name, width: node.width, height: node.height, x: 100, y: 0 });
        }
        for (const edge of edges) {
            g.setEdge(edge.from, edge.to, { minlen: 1, messages: edge.messages, weight: edge.weight });
        }
        layout(g, { marginx: 250, marginy: 250 });
        const retnodes = g.nodes().map(n => ({
            name: n,
            width: g.node(n).width,
            height: g.node(n).height,
            depth: 1,
            x: g.node(n).x,
            y: g.node(n).y,
            z: 0.1
        }));
        const retedges = g.edges().map(e => ({ points: g.edge(e).points.map(p => ({ z: 0.1, ...p })), messages: g.edge(e)["messages"] }));
        const width = retnodes.reduce((p, c) => [Math.min(c.x, p[0]), Math.max(c.x + c.width, p[1])], [0, 0]) as [number, number]
        const height = retnodes.reduce((p, c) => [Math.min(c.y, p[0]), Math.max(c.y + c.height, p[1])], [0, 0]) as [number, number]
        const depth = [-20, 0] as [number, number];
        return { nodes: retnodes, width, height, depth, edges: retedges }
    }, [nodes, edges, direction])
}


