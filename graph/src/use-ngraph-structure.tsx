import { groupBy, keyBy } from "lodash";
import createLayout from "ngraph.forcelayout";
import createGraph, { Link } from "ngraph.graph";
import { useCallback, useMemo } from "react";
import { calculateDistance, HierarchicalEdge, HierarchicalNode, GraphNodeVisible, Size } from "./model";

/** Simply group nodes by their parent, null means no parent */
export function useChildrenNodesByParent(nodes: HierarchicalNode[]) {
    const childrenNodesByParent = useMemo<Record<string, HierarchicalNode[]>>(
        () => groupBy(nodes, (node) => node.parent),
        [nodes]
    );
    const nodesDict = keyBy(nodes, (n) => n.name);
    return [childrenNodesByParent, nodesDict ] as [Record<string,HierarchicalNode[]>,Record<string,HierarchicalNode>];
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
    nodes: HierarchicalNode[],
    nodeChildrenByParent: Record<string, HierarchicalNode[]>,
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
    childrenNodesByParent: Record<string, HierarchicalNode[]>,
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
    node: HierarchicalNode
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
    childrenNodesByParent: Record<string, HierarchicalNode[]>,
    getVisibleNode: (name: string) => GraphNodeVisible,
    edges: HierarchicalEdge[],
    visibleNodesDict: Record<string, GraphNodeVisible>,
    defaultSize: Size
) {
    const { graph, allLinks } = useMemo(() => {
        const graph = createGraph<HierarchicalNode, HierarchicalEdge>({ multigraph: true });
        visibleNodes.forEach((node) => graph.addNode(node.name, node));

        const allLinks: Link<HierarchicalEdge>[] = [];
        // Add links between nodes, using the aliases from above, which covers which nodes are expanded
        for (const edge of edges) {
            if (getVisibleNode(edge.from) !== getVisibleNode(edge.to)) {
                edge.score = calculateDistance(
                    edge,
                    visibleNodesDict,
                    getVisibleNode(edge.from),
                    getVisibleNode(edge.to),
                    defaultSize
                );
                allLinks.push(graph.addLink(getVisibleNode(edge.from)?.name, getVisibleNode(edge.to)?.name, edge));
            }
        }
        for (const parent of Object.keys(childrenNodesByParent)) {
            if (!visibleNodesDict[parent] || !visibleNodesDict[parent].visible) continue;
            for (const child of childrenNodesByParent[parent]) {
                if (!visibleNodesDict[child.name] || !visibleNodesDict[child.name].visible) continue;
                const c = visibleNodesDict[child.name];
                const edge: HierarchicalEdge = {
                    from: child.name,
                    to: parent,
                    label: `${parent} to ${c.name}`,
                    hierarchical: true,
                };
                edge.score = calculateDistance(edge, visibleNodesDict, child, visibleNodesDict[parent], defaultSize);
                allLinks.push(graph.addLink(child.name, parent, edge));
            }
        }
        return { graph, allLinks };
    }, [childrenNodesByParent, defaultSize, edges, getVisibleNode, visibleNodes, visibleNodesDict]);
    return { graph, allLinks };
}
