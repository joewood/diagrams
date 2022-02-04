import { groupBy, keyBy } from "lodash";
import createLayout, { PhysicsSettings, Vector, Layout as NGraphLayout } from "ngraph.forcelayout";
import { Graph, Link } from "ngraph.graph";
import { useMemo } from "react";
import { useSimpleGraph } from ".";
import { getAnchor, getContainingRect, getMidPoint, HierarchicalEdge, HierarchicalNode, Size } from "./model";
import {
    getAllChildren,
    trickleUpMass,
    useChildrenNodesByParent,
    useGraph,
    useVisibleNodes,
} from "./use-ngraph-structure";

export interface UseNGraphOptions {
    /** Default size of all nodes */
    defaultSize?: Size;
    /** Number of iterations */
    iterations?: number;
    textSize?: number;
    physics?: Partial<PhysicsSettings>;
}


// function useLayout(
//     graph: Graph<HierarchicalNode, HierarchicalEdge>,
//     allLinks: Link<HierarchicalEdge>[],
//     leafNodes: GraphNodeVisible[],
//     visibleNodesDict: Record<string, GraphNodeVisible>,
//     iterations: number,
//     options: Required<UseNGraphOptions>
// ) {
//     return useMemo(() => {
//         // Do the LAYOUT
//         // console.log("Physics", options.physics)
//         const layout = createLayout(graph, {
//             ...(options.physics || {}),
//             gravity: -1200,
//             dimensions: 2,
//         });
//         // for (const link of allLinks) {
//         //     const spring = layout.getSpring(link);
//         //     const edge = link.data;
//         //     if (spring && edge && link.data.score) {
//         //         spring.length = link.data.score;
//         //     }
//         // }
//         layout.forEachBody((body) => (body.mass = 10 * options.defaultSize.width));
//         leafNodes.forEach((n) => trickleUpMass(visibleNodesDict, layout, n));
//         // const qt = new QuadTree(new Box(0, 0, 1000, 1000));
//         // graph.forEachNode((n) => {
//         //     const body = layout.getBody(n.id);
//         //     if (body) qt.insert(getPointsFromBox(body.pos.x, body.pos.y, n.data.size.width, n.data.size.height));
//         // });
//         for (let i = 0; i < iterations; ++i) {
//             const oldPos: Record<string, Vector> = {};
//             graph.forEachNode((n) => {
//                 const body1 = layout.getBody(n.id);
//                 if (!body1) return;
//                 oldPos[n.id] = body1?.pos;
//             });
//             graph.forEachNode((node1) => {
//                 const body1 = layout.getBody(node1.id);
//                 if (!body1 || !node1 || !node1.data || !node1.data.size) return;
//                 const rect1 = {
//                     x: body1?.pos.x,
//                     y: body1?.pos.y,
//                     width: node1?.data?.size.width,
//                     height: node1?.data?.size.height,
//                 };
//                 graph.forEachNode((node2) => {
//                     const body2 = layout.getBody(node2.id);
//                     if (!body2 || !node2 || !node2.data || !node2.data.size) return;
//                     const rect2 = {
//                         x: body2?.pos.x,
//                         y: body2?.pos.y,
//                         width: node2?.data?.size.width,
//                         height: node2?.data?.size.height,
//                     };
//                 });
//             });
//             layout.step();
//         }
//         return layout;
//     }, [graph, iterations, leafNodes, options.defaultSize.width, options.physics, visibleNodesDict]);
// }

// function resizeNodeTree(
//     leafNodes: GraphNodeVisible[],
//     visibleNodesDict: Record<string, GraphNodeVisible>,
//     layoutNodesDict: Record<string, LayoutNode>,
//     childrenNodesByParent: Record<string, HierarchicalNode[]>,
//     options: Required<UseNGraphOptions>
// ) {
//     // start off with the leaf Node names
//     let treeLevel = leafNodes.map((node) => node.name);
//     let levelNumber = 1;
//     // while more leaf nodes to do
//     while (treeLevel.length > 0) {
//         for (const nodeName of treeLevel) {
//             layoutNodesDict[nodeName].levelNumber = levelNumber;
//         }
//         // get all the parent node names of the current level
//         treeLevel = treeLevel
//             .filter((nodeName) => visibleNodesDict[nodeName].visible)
//             .map((nodeName) => visibleNodesDict[nodeName].parent)
//             .filter(Boolean) as string[];
//         for (const nodeName of treeLevel) {
//             const newPosSize = getContainingRect(
//                 getAllChildren(childrenNodesByParent, visibleNodesDict, nodeName).map((v) => layoutNodesDict[v]),
//                 options.textSize
//             );
//             if (!!layoutNodesDict[nodeName]) {
//                 layoutNodesDict[nodeName].position = {
//                     x: newPosSize.position.x + newPosSize.size.width / 2,
//                     y: newPosSize.position.y + newPosSize.size.height / 2,
//                 };
//                 layoutNodesDict[nodeName].size = newPosSize.size;
//             }
//         }
//         levelNumber++;
//     }
// }

// function getNodesFromLayout(
//     visibleNodesDict: Record<string, GraphNodeVisible>,
//     leafNodes: GraphNodeVisible[],
//     layout: ReturnType<typeof createLayout>,
//     options: Required<UseNGraphOptions>
// ) {
//     const layoutNodes: (LayoutNode & Visible)[] = [];
//     const leafDict = keyBy(leafNodes, (n) => n.name);
//     // DONE LAYOUT - NOW LOAD UP
//     const layoutNodesDict: Record<string, LayoutNode> = {};
//     layout.forEachBody((body, key) => {
//         if (visibleNodesDict[key].visible) {
//             const visibleNode = visibleNodesDict[key];
//             const v: LayoutNodeVisible = {
//                 ...visibleNode,
//                 body,
//                 levelNumber: 0,
//                 size: visibleNodesDict[key].size ?? options.defaultSize,
//                 position: layout.getNodePosition(key),
//                 backgroundColor: visibleNodesDict[key].backgroundColor,
//                 isLeaf: !!leafDict[key],
//             };
//             layoutNodes.push(v);
//             layoutNodesDict[key] = v;
//         }
//     });
//     for (const node of layoutNodes) {
//         if (node.parent) node.parentNode = layoutNodesDict[node.parent];
//     }
//     return { layoutNodes, layoutNodesDict };
// }

/** Iterate over edges and create line structures */
// function getEdgesFromLayout(
//     graph: Graph<HierarchicalNode, HierarchicalEdge>,
//     layout: NGraphLayout<Graph<HierarchicalNode, HierarchicalEdge>>,
//     options: Required<UseNGraphOptions>
// ) {
//     const layoutEdges: LayoutEdge[] = [];
//     graph.forEachLink((link) => {
//         // if (link.data.hierarchical) return;
//         const fromPos = layout.getNodePosition(link.fromId);
//         const toPos = layout.getNodePosition(link.toId);
//         const fromNode = graph.getNode(link.fromId)?.data! as LayoutNode;
//         if (!fromNode) {
//             console.error("Cannot find FROM node for ", link.fromId);
//             return;
//         }
//         const toNode = graph.getNode(link.toId)?.data! as LayoutNode;
//         if (!toNode) {
//             console.error("Cannot find TO node for ", link.toId);
//             return;
//         }
//         const midPoint = { x: getMidPoint(fromPos.x, toPos.x, 0.5), y: getMidPoint(fromPos.y, toPos.y, 0.5) };
//         const fromPoint = getAnchor(fromPos, fromNode.size ?? options.defaultSize, toPos);
//         const toPoint = getAnchor(toPos, toNode.size ?? options.defaultSize, fromPos);
//         layoutEdges.push({
//             ...link.data,
//             name: `${link.data?.from} -> ${link.data?.to ?? "NULL"}`,
//             from: link.fromId as string,
//             to: link.toId as string,
//             fromNode,
//             toNode,
//             points: [fromPoint, midPoint, toPoint],
//             hide: link.data.hierarchical,
//             link,
//         });
//     });
//     return layoutEdges;
// }

/** The Layout in NGraph needs to be iterated. We also need to resize the hierarchical parent nodes so that they
 * contain all their children. */
// function useGraphStructureFromLayout<T extends Graph>(
//     graph: T,
//     leafNodes: GraphNodeVisible[],
//     layout: ReturnType<typeof createLayout>,
//     visibleNodesDict: Record<string, GraphNodeVisible>,
//     childrenNodesByParent: Record<string, HierarchicalNode[]>,
//     options: Required<UseNGraphOptions>
// ) {
//     return useMemo<[LayoutNodeVisible[], LayoutEdge[]]>(() => {
//         const { layoutNodes, layoutNodesDict } = getNodesFromLayout(visibleNodesDict, leafNodes, layout, options);
//         resizeNodeTree(leafNodes, visibleNodesDict, layoutNodesDict, childrenNodesByParent, options);
//         const layoutEdges = getEdgesFromLayout(graph, layout, options);
//         return [layoutNodes, layoutEdges];
//     }, [childrenNodesByParent, graph, layout, leafNodes, options, visibleNodesDict]);
// }

// export function useNgraph(
//     nodes: HierarchicalNode[],
//     edges: HierarchicalEdge[],
//     expanded: string[] = [],
//     options:GraphOptions
// ) {
    
//     const visibleNodes = nodes.filter( n=> n.parent===null || expanded.includes(n.parent))
//     const leafNodes  =visibleNodes.filter( n=> n.parent===null)
//     const { childrenNodesByParent } = useChildrenNodesByParent(visibleNodes);

//     // const { visibleNodes, visibleNodesDict, getVisibleNode, leafNodes } = useVisibleNodes(
//     //     nodes,
//     //     childrenNodesByParent,
//     //     expanded
//     // );
//     const [ positionedLeafNodes, positionedLeafEdges ] = useSimpleGraph(
//         leafNodes,
//         edges,
//         options
//     );
//         const positionedNodeDict = keyBy(positionedLeafNodes,n=>n.name)
//         const positionedParents = Object.keys(childrenNodesByParent).map( k => {


//         })

//         }

//     const [layoutNodes, layoutEdges] = useGraphStructureFromLayout(
//         graph,
//         leafNodes,
//         layout,
//         visibleNodesDict,
//         childrenNodesByParent,
//         options
//     );
//     const positioned = useMemo(() => {
//         // TODO - raise issue the type is wrong in ngraph.layout
//         const { position, size } = getContainingRect(layoutNodes, options.textSize);
//         const width = Math.max(2 * options.defaultSize.width, size.width);
//         const height = Math.max(2 * options.defaultSize.height, size.height);
//         return {
//             nodes: layoutNodes,
//             edges: layoutEdges,
//             minPoint: { x: position.x - options.textSize, y: position.y - options.textSize },
//             maxPoint: { x: position.x + width + options.textSize, y: position.y + height + options.textSize },
//             tree: groupBy(layoutNodes, (n) => n.parent || ""),
//             expanded,
//             textSize: options.textSize,
//         };
//     }, [layoutNodes, options.textSize, options.defaultSize.width, options.defaultSize.height, layoutEdges, expanded]);
//     return positioned;
// }
