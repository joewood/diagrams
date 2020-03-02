import { graphlib, layout } from "dagre";
import { useMemo } from "react";
import { Layout, PositionedNode, PositionedEdge } from "./use-graph-viewport";
import { Vector3 } from "three";
import { SimEdge, SimNode } from "./sim-model";

export function useDag(nodes: SimNode[], edges: SimEdge[], direction = "LR"): Layout {
    return useMemo<Layout>(() => {
        const g = new graphlib.Graph({ directed: true });
        g.setGraph({ edgesep: 100, nodesep: 100, marginx: 20, marginy: 20, rankdir: "LR" });
        g.setDefaultEdgeLabel(() => {
            return {};
        });
        for (const node of nodes) {
            g.setNode(node.name, {
                type: node.type || "basic",
                label: node.name,
                width: node.width,
                height: node.height,
                x: 100,
                y: 0
            });
        }
        for (const edge of edges) {
            g.setEdge(edge.from, edge.to, { minlen: 1, weight: edge.weight });
        }
        layout(g, { marginx: 250, marginy: 250 });
        const retnodes = g.nodes().map<PositionedNode>(n => ({
            name: n,
            width: g.node(n).width,
            height: g.node(n).height,
            depth: 1,
            position: new Vector3(g.node(n).x, g.node(n).y, -0.1),
            type: g.node(n).type || "basic"
        }));
        const retedges = g.edges().map<PositionedEdge>(e => {
            return {
                points: g.edge(e).points.map(p => new Vector3(p.x, p.y, -0.1)),
                from: e.v,
                to: e.w
            };
        });
        const { height, width } = g.graph(); // retnodes.reduce((p, c) => [Math.min(c.x, p[0]), Math.max(c.x + c.width, p[1])], [0, 0]) as [number, number ];
        const depth = [-20, 0] as [number, number];
        return { nodes: retnodes, width: [0, width], height: [0, height], depth, edges: retedges } as Layout;
    }, [nodes, edges]);
}
