import { countBy, keyBy } from "lodash";
import createLayout from "ngraph.forcelayout";
import createGraph, { Link } from "ngraph.graph";
import { useMemo } from "react";
import {
    calculateDistance,
    getAnchor,
    getMidPoint,
    GraphEdge,
    GraphNode,
    Layout,
    LayoutEdge,
    LayoutNode,
    minMax,
    Size,
} from "./model";

interface GraphOptions {
    /** Default size of all nodes */
    defaultSize?: Size;
    /** Number of iterations */
    iterations?: number;
    /** List of Node names that are expanded (if they have children) */
    expanded?: string[];
}

export function useNgraph(
    nodes: GraphNode[],
    edges: GraphEdge[],
    { expanded = [], defaultSize = { width: 12, height: 8 }, iterations = 100 }: GraphOptions
): Layout {
    const textSize = 2;
    const positioned = useMemo(() => {
        const nodeDict = keyBy(nodes, (n) => n.name);

        const graph = createGraph<GraphNode, GraphEdge>({ multigraph: true });
        const nodeAlias: Record<string, string> = {};
        const nodeParentToChildren: Record<string, string[]> = {};
        for (const node of nodes) {
            // level 2 nodes get included unless they're expanded
            if (node.level === 2) {
                graph.addNode(node.name, node);
                nodeAlias[node.name] = node.name;
            } else {
                // leaf nodes get expanded only if the parent is expanded
                if (node.parent && expanded.includes(node.parent)) {
                    graph.addNode(node.name, node);
                    nodeAlias[node.name] = node.name;
                    // add a link to all existing nodes with this parent
                    nodeParentToChildren[node.parent] = [...(nodeParentToChildren[node.parent] || []), node.name];
                } else {
                    if (node.parent) nodeAlias[node.name] = node.parent;
                }
            }
        }
        const allLinks: Link<GraphEdge>[] = [];
        // Add links between nodes, using the aliases from above, which covers which nodes are expanded
        for (const edge of edges) {
            if (nodeAlias[edge.from] !== nodeAlias[edge.to]) {
                edge.score = calculateDistance(edge, nodeDict[nodeAlias[edge.from]], nodeDict[nodeAlias[edge.to]]);
                allLinks.push(graph.addLink(nodeAlias[edge.from], nodeAlias[edge.to], edge));
                const parent = nodeDict[edge.from]?.parent;
                // if sibling with the same parent, then remove the from node from the nodeParentToChildren list
                if (parent && nodeParentToChildren[parent] && parent === nodeDict[edge.to]?.parent) {
                    nodeParentToChildren[parent] = nodeParentToChildren[parent].filter((p) => p !== edge.from);
                }
            }
        }
        for (const parent of Object.keys(nodeParentToChildren)) {
            for (const first of nodeParentToChildren[parent]) {
                const edge: GraphEdge = { from: first, to: parent, hierarchical: true };
                edge.score = calculateDistance(edge, nodeDict[first], nodeDict[parent]);
                allLinks.push(graph.addLink(first, parent, edge));
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
            springLength: 35,
        });
        for (const link of allLinks) {
            const spring = layout.getSpring(link);
            const edge = link.data;
            if (spring && edge && link.data.score) {
                spring.length = link.data.score;
            }
        }
        for (const parent of Object.keys(nodeParentToChildren)) {
            for (const node of nodeParentToChildren[parent]) {
                const spring = layout.getSpring(node, parent);
                if (!!spring) spring.length = 25;
            }
        }
        const childCountByParent = countBy(nodes, (n) => n.parent);
        for (const parent of expanded) {
            const body = layout.getBody(parent);
            if (!!body && childCountByParent[parent]) body.mass = 5 * childCountByParent[parent];
        }
        for (let i = 0; i < iterations; ++i) layout.step();
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
                ...link.data,
                name: `${link.data.from} -> ${link.data.to}`,
                from: link.fromId as string,
                to: link.toId as string,
                points: [fromPoint, midPoint, toPoint],
            });
        });
        // TODO - raise issue the type is wrong in ngraph.layout
        const { x1, x2, y1, y2 } = minMax(layoutNodes, textSize);
        const width = Math.max(50, x2 - x1);
        const height = Math.max(40, y2 - y1);
        return {
            nodes: layoutNodes,
            edges: layoutEdges,
            minPoint: { x: x1 - textSize, y: y1 - textSize },
            maxPoint: { x: x1 + width + textSize, y: y1 + height + textSize },
            expanded,
            textSize,
        };
    }, [nodes, edges, expanded, iterations, defaultSize]);
    return positioned;
}
