import { keyBy } from "lodash";
import createLayout from "ngraph.forcelayout";
import createGraph from "ngraph.graph";
import { useMemo } from "react";
import { getAnchor, getMidPoint, GraphEdge, GraphNode, Layout, LayoutEdge, LayoutNode, minMax, Size } from "./model";

interface GraphOptions {
    /** Default size of all nodes */
    defaultSize?: Size;
    /** Number of iterations */
    iterations?: number;
    /** List of Node names that are expanded (if they have children) */
    expanded?: string[];
}

export function useNgraph2(
    nodes: GraphNode[],
    edges: GraphEdge[],
    { expanded = [], defaultSize = { width: 20, height: 8 }, iterations = 100 }: GraphOptions
): Layout {
    const textSize = 2;
    const positioned = useMemo(() => {
        const graph = createGraph<GraphNode, GraphEdge>({ multigraph: true });
        const nodeAlias: Record<string, string> = {};
        const nodePeers: Record<string, string[]> = {};
        for (const node of nodes) {
            // level 2 nodes get included unless they're expanded
            if (node.level === 2) {
                if (!expanded.includes(node.name)) {
                    graph.addNode(node.name, node);
                    nodeAlias[node.name] = node.name;
                }
            } else {
                // leaf nodes get expanded only if the parent is expanded
                if (node.parent && expanded.includes(node.parent)) {
                    graph.addNode(node.name, node);
                    nodeAlias[node.name] = node.name;
                    // add a link to all existing nodes with this parent
                    nodePeers[node.parent] = [...(nodePeers[node.parent] || []), node.name];
                } else {
                    if (node.parent) nodeAlias[node.name] = node.parent;
                }
            }
        }
        // Add links between nodes, using the aliases from above, which covers which nodes are expanded
        for (const edge of edges) {
            if (nodeAlias[edge.from] !== nodeAlias[edge.to])
                graph.addLink(nodeAlias[edge.from], nodeAlias[edge.to], edge);
        }
        for (const parent of Object.keys(nodePeers)) {
            for (const first of nodePeers[parent]) {
                for (const second of nodePeers[parent]) {
                    if (first !== second) graph.addLink(first, second, { from: first, to: second, hierarchical: true });
                }
            }
        }
        // for (const node of nodes) {
        //     if (node.parent && expanded.includes(node.parent))
        //         graph.addLink(node.name, node.parent, { from: node.name, to: node.parent, hierarchical: true });
        // }

        // Do the LAYOUT
        const layout = createLayout(graph, {
            dimensions: 2,
            gravity: -30,
            springLength: 20,
        });
        for (let i = 0; i < iterations; ++i) layout.step();
        const nodeDict = keyBy(nodes, (n) => n.name);
        const layoutNodes: LayoutNode[] = [];
        layout.forEachBody((body, key, dict) => {
            if (nodeDict[key])
                layoutNodes.push({
                    ...nodeDict[key],
                    size: nodeDict[key].size ?? defaultSize,
                    level: nodeDict[key].level,
                    position: layout.getNodePosition(key),
                });
        });
        const layoutEdges: LayoutEdge[] = [];
        graph.forEachLink((link) => {
            if (link.data.hierarchical) return;
            const fromPos = layout.getNodePosition(link.fromId);
            const toPos = layout.getNodePosition(link.toId);
            const fromNode = graph.getNode(link.fromId)?.data!;
            const toNode = graph.getNode(link.toId)?.data!;
            if (!fromNode || !toNode) console.error("Cannot find node for ", link);
            const midPoint = { x: getMidPoint(fromPos.x, toPos.x, 0.5), y: getMidPoint(fromPos.y, toPos.y, 0.5) };
            const fromPoint = getAnchor(fromPos, fromNode.size ?? defaultSize, toPos);
            const toPoint = getAnchor(toPos, toNode.size ?? defaultSize, fromPos);
            layoutEdges.push({
                name: `${link.data.from} -> ${link.data.to}`,
                from: link.fromId as string,
                to: link.toId as string,
                points: [fromPoint, midPoint, toPoint],
            });
        });
        // TODO - raise issue the type is wrong in ngraph.layout
        const { x1, x2, y1, y2 } = minMax(layoutNodes, textSize);
        // const textSize = (y2 - y1) / 50;
        return {
            nodes: layoutNodes,
            edges: layoutEdges,
            minPoint: { x: x1 - textSize, y: y1 + textSize },
            maxPoint: { x: x2 - textSize, y: y2 + textSize },
            expanded,
            textSize,
        };
    }, [nodes, edges, expanded, iterations, defaultSize]);
    return positioned;
}
