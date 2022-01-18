import { groupBy, uniq } from "lodash";
import createLayout from "ngraph.forcelayout";
import { Graph, Link } from "ngraph.graph";
import { useCallback, useMemo } from "react";
import {
    getAnchor,
    getContainingRect,
    getMidPoint,
    GraphEdge,
    GraphNode,
    GraphNodeVisible,
    Layout,
    LayoutEdge,
    LayoutNode,
    LayoutNodeVisible,
    Size,
    Visible,
} from "./model";
import {
    getAllChildren,
    trickleUpMass,
    useChildrenNodesByParent,
    useGraph,
    useVisibleNodes,
} from "./use-ngraph-structure";

interface UseNGraphOptions {
    /** Default size of all nodes */
    defaultSize?: Size;
    /** Number of iterations */
    iterations?: number;
    textSize?: number;
}

function useLayout<T extends Graph>(
    graph: T,
    allLinks: Link<GraphEdge>[],
    leafNodes: GraphNodeVisible[],
    visibleNodesDict: Record<string, GraphNodeVisible>,
    iterations: number
) {
    return useMemo(() => {
        // Do the LAYOUT
        const layout = createLayout(graph, {
            dimensions: 2,
            gravity: -40,
            springLength: 35,
        });
        for (const link of allLinks) {
            const spring = layout.getSpring(link);
            const edge = link.data;
            if (spring && edge && link.data.score) {
                spring.length = link.data.score;
            }
        }
        layout.forEachBody((body, key, dict) => {
            body.mass = 5;
        });
        leafNodes.forEach((n) => trickleUpMass(visibleNodesDict, layout, n));
        for (let i = 0; i < iterations; ++i) layout.step();
        return layout;
    }, [allLinks, graph, iterations, leafNodes, visibleNodesDict]);
}

function resizeNodeTree(
    leafNodes: GraphNodeVisible[],
    visibleNodesDict: Record<string, GraphNodeVisible>,
    layoutNodesDict: Record<string, LayoutNode>,
    childrenNodesByParent: Record<string, GraphNode[]>,
    options: UseNGraphOptions
) {
    let treeLayer = leafNodes.map((l) => l.name);
    let levelNumber = 1;
    while (treeLayer.length > 0) {
        treeLayer = treeLayer
            .filter((l) => visibleNodesDict[l].visible)
            .map((l) => visibleNodesDict[l].parent)
            .filter(Boolean) as string[];
        for (const nodeName of treeLayer) {
            // console.log(
            // getAllChildren(childrenNodesByParent, visibleNodesDict, nodeName).map((v) => layoutNodesDict[v])
            // );
            const newPosSize = getContainingRect(
                getAllChildren(childrenNodesByParent, visibleNodesDict, nodeName).map((v) => layoutNodesDict[v]),
                options.textSize
            );
            layoutNodesDict[nodeName].position = {
                x: newPosSize.position.x + newPosSize.size.width / 2,
                y: newPosSize.position.y + newPosSize.size.height / 2,
            };
            layoutNodesDict[nodeName].size = newPosSize.size;
            layoutNodesDict[nodeName].levelNumber = levelNumber;
        }
        levelNumber++;
    }
}

function loadUpNodes(
    visibleNodesDict: Record<string, GraphNodeVisible>,

    layout: ReturnType<typeof createLayout>,
    options: UseNGraphOptions
) {
    const layoutNodes: (LayoutNode & Visible)[] = [];

    // DONE LAYOUT - NOW LOAD UP
    const layoutNodesDict: Record<string, LayoutNode> = {};
    layout.forEachBody((body, key, dict) => {
        if (visibleNodesDict[key].visible) {
            const v: LayoutNodeVisible = {
                ...visibleNodesDict[key],
                body,
                size: visibleNodesDict[key].size ?? options.defaultSize,
                position: layout.getNodePosition(key),
            };
            layoutNodes.push(v);
            layoutNodesDict[key] = v;
        }
    });
    return { layoutNodes, layoutNodesDict };
}

function loadUpEdges<T extends Graph>(graph: T, layout: ReturnType<typeof createLayout>, options: UseNGraphOptions) {
    const layoutEdges: LayoutEdge[] = [];
    graph.forEachLink((link) => {
        // if (link.data.hierarchical) return;
        const fromPos = layout.getNodePosition(link.fromId);
        const toPos = layout.getNodePosition(link.toId);
        const fromNode = graph.getNode(link.fromId)?.data!;
        if (!fromNode) {
            console.error("Cannot find FROM node for ", link.fromId);
            return;
        }
        const toNode = graph.getNode(link.toId)?.data!;
        if (!toNode) {
            console.error("Cannot find TO node for ", link.toId);
            return;
        }
        const midPoint = { x: getMidPoint(fromPos.x, toPos.x, 0.5), y: getMidPoint(fromPos.y, toPos.y, 0.5) };
        const fromPoint = getAnchor(fromPos, fromNode.size ?? options.defaultSize, toPos);
        const toPoint = getAnchor(toPos, toNode.size ?? options.defaultSize, fromPos);
        layoutEdges.push({
            ...link.data,
            name: `${link.data.from} -> ${link.data.to}`,
            from: link.fromId as string,
            to: link.toId as string,
            points: [fromPoint, midPoint, toPoint],
            hide: link.data.hierarchical,
            link,
        });
    });
    return layoutEdges;
}

function useLoadUp<T extends Graph>(
    graph: T,
    leafNodes: GraphNodeVisible[],
    layout: ReturnType<typeof createLayout>,
    visibleNodesDict: Record<string, GraphNodeVisible>,
    childrenNodesByParent: Record<string, GraphNode[]>,
    options: UseNGraphOptions
) {
    return useMemo<[LayoutNodeVisible[], LayoutEdge[]]>(() => {
        const { layoutNodes, layoutNodesDict } = loadUpNodes(visibleNodesDict, layout, options);
        resizeNodeTree(leafNodes, visibleNodesDict, layoutNodesDict, childrenNodesByParent, options);
        const layoutEdges = loadUpEdges(graph, layout, options);
        return [layoutNodes, layoutEdges];
    }, [childrenNodesByParent, graph, layout, leafNodes, options, visibleNodesDict]);
}

export function useNgraph(
    nodes: GraphNode[],
    edges: GraphEdge[],
    expanded: string[] | null = null,
    { defaultSize = { width: 12, height: 8 }, iterations = 100, textSize = 2, ...other }: UseNGraphOptions
): Layout {
    const options = useMemo(
        () => ({ ...other, defaultSize, iterations, textSize }),
        [defaultSize, iterations, textSize, other]
    );
    const { childrenNodesByParent } = useChildrenNodesByParent(nodes);
    const { visibleNodes, visibleNodesDict, getVisibleNode, leafNodes } = useVisibleNodes(
        nodes,
        childrenNodesByParent,
        expanded
    );
    const { graph, allLinks } = useGraph(visibleNodes, childrenNodesByParent, getVisibleNode, edges, visibleNodesDict);
    const layout = useLayout(graph, allLinks, leafNodes, visibleNodesDict, iterations);
    const [layoutNodes, layoutEdges] = useLoadUp(
        graph,
        leafNodes,
        layout,
        visibleNodesDict,
        childrenNodesByParent,
        options
    );
    const positioned = useMemo(() => {
        // TODO - raise issue the type is wrong in ngraph.layout
        const { position, size } = getContainingRect(layoutNodes, options.textSize);
        const width = Math.max(50, size.width);
        const height = Math.max(40, size.height);
        return {
            nodes: layoutNodes,
            edges: layoutEdges,
            minPoint: { x: position.x - options.textSize, y: position.y - options.textSize },
            maxPoint: { x: position.x + width + options.textSize, y: position.y + height + options.textSize },
            tree: groupBy(layoutNodes, (n) => n.parent || ""),
            expanded,
            textSize: options.textSize,
        };
    }, [layoutNodes, options.textSize, layoutEdges, expanded]);
    return positioned;
}
