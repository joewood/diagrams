import { groupBy, keyBy } from "lodash";
import createLayout from "ngraph.forcelayout";
import createGraph, { Link } from "ngraph.graph";
import { useCallback, useMemo } from "react";
import { calculateDistance, GraphEdge, GraphNode, GraphNodeVisible } from "./model";

/** Simply group nodes by their parent, null means no parent */
export function useChildrenNodesByParent(nodes: GraphNode[]) {
    const childrenNodesByParent = useMemo<Record<string, GraphNode[]>>(
        () => groupBy(nodes, (node) => node.parent),
        [nodes]
    );
    const nodesDict = keyBy(nodes, (n) => n.name);
    return { childrenNodesByParent, nodesDict };
}

/** Properties of the visible Graph */
interface UseVisibleNodesResult {
    /** Collection of visible nodes */
    visibleNodes: GraphNodeVisible[];
    /** Node by name for visible nodes */
    visibleNodesDict: Record<string, GraphNodeVisible>;
    /** For a given visible or invisible node return it's parent that is visible */
    getVisibleNode: (name: string) => GraphNodeVisible;
    /** set of visible nodes at the leaf (no children) */
    leafNodes: GraphNodeVisible[];
}

/** Return the graph structure that is dependent on what is hierarchically visible */
export function useVisibleNodes(
    nodes: GraphNode[],
    nodeChildrenByParent: Record<string, GraphNode[]>,
    expanded: string[] | null
): UseVisibleNodesResult {
    const visibleNodes: GraphNodeVisible[] = useMemo(
        () =>
            nodes.map((node) => ({
                ...node,
                visible: expanded === null || node.parent === null || expanded.includes(node.parent),
            })),
        [nodes, expanded]
    );
    const visibleNodesDict = useMemo(() => keyBy(visibleNodes, (node) => node.name), [visibleNodes]);
    const visibleNodeChildrenByParent = useMemo(
        () =>
            groupBy(
                visibleNodes.filter((n) => n.visible),
                (n) => n.parent
            ),
        [visibleNodes]
    );
    const getVisibleNode = useCallback(
        (node: string | null) => {
            while (node && visibleNodesDict[node] && !visibleNodesDict[node].visible) {
                node = visibleNodesDict[node].parent;
            }
            return visibleNodesDict[node ?? ""] ?? null;
        },
        [visibleNodesDict]
    );
    const leafNodes = useMemo(
        () => visibleNodes.filter((node) => node.visible && !visibleNodeChildrenByParent[node.name]),
        [visibleNodes, visibleNodeChildrenByParent]
    );
    return { visibleNodes, visibleNodesDict, getVisibleNode, leafNodes };
}

/** Returns the node names of all the children in the tree */
export function getAllChildren(
    childrenNodesByParent: Record<string, GraphNode[]>,
    visibleNodesDict: Record<string, GraphNodeVisible>,
    nodeName: string
): string[] {
    if (!childrenNodesByParent[nodeName]) return [];
    const visibleChildren = childrenNodesByParent[nodeName].filter((v) => visibleNodesDict[v.name].visible);
    return visibleChildren.reduce(
        (p, c) => [...p, ...getAllChildren(childrenNodesByParent, visibleNodesDict, c.name)],
        visibleChildren.map((v) => v.name)
    );
}

export function trickleUpMass(
    visibleNodesDict: Record<string, GraphNodeVisible>,
    layout: ReturnType<typeof createLayout>,
    node: GraphNode
) {
    // Given a leaf node, trickly the mass up through the visible nodes
    if (!node.parent) return;
    const body = layout.getBody(node.name);
    const parentBody = layout.getBody(node.parent);
    if (!body || !parentBody) return;
    parentBody.mass = parentBody.mass + body.mass;
    trickleUpMass(visibleNodesDict, layout, visibleNodesDict[node.parent]);
}

export function useGraph(
    visibleNodes: GraphNodeVisible[],
    childrenNodesByParent: Record<string, GraphNode[]>,
    getVisibleNode: (name: string) => GraphNodeVisible,
    edges: GraphEdge[],
    visibleNodesDict: Record<string, GraphNodeVisible>
) {
    const { graph, allLinks } = useMemo(() => {
        const graph = createGraph<GraphNode, GraphEdge>({ multigraph: true });
        visibleNodes.forEach((node) => graph.addNode(node.name, node));

        const allLinks: Link<GraphEdge>[] = [];
        // Add links between nodes, using the aliases from above, which covers which nodes are expanded
        for (const edge of edges) {
            if (getVisibleNode(edge.from) !== getVisibleNode(edge.to)) {
                edge.score = calculateDistance(
                    edge,
                    visibleNodesDict,
                    getVisibleNode(edge.from),
                    getVisibleNode(edge.to)
                );
                allLinks.push(graph.addLink(getVisibleNode(edge.from)?.name, getVisibleNode(edge.to)?.name, edge));
                // const parent = visibleNodesDict[edge.from]?.parent;
                // if sibling with the same parent, then remove the from node from the nodeParentToChildren list
                // if (parent && childrenNodesByParent[parent] && parent === visibleNodesDict[edge.to]?.parent) {
                //     childrenNodesByParent[parent] = childrenNodesByParent[parent].filter((p) => p.name !== edge.from);
                // }
            }
        }
        for (const parent of Object.keys(childrenNodesByParent)) {
            if (!visibleNodesDict[parent] || !visibleNodesDict[parent].visible) continue;
            for (const child of childrenNodesByParent[parent]) {
                if (!visibleNodesDict[child.name] || !visibleNodesDict[child.name].visible) continue;
                const c = visibleNodesDict[child.name];
                const edge: GraphEdge = {
                    from: child.name,
                    to: parent,
                    label: `${parent} to ${c.name}`,
                    hierarchical: true,
                };
                edge.score = calculateDistance(edge, visibleNodesDict, child, visibleNodesDict[parent]);
                allLinks.push(graph.addLink(child.name, parent, edge));
            }
        }
        return { graph, allLinks };
    }, [childrenNodesByParent, edges, getVisibleNode, visibleNodes, visibleNodesDict]);
    return { graph, allLinks };
}
