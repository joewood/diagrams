import { useThree } from "@react-three/fiber";
import React, { FC, useCallback } from "react";
import { Mesh } from "three";
import { Layout } from "./model";
// import { BrokerQueueNode } from "../component/broker-queue";

interface GraphProps {
    graph: Layout;
    // feed: { to: string | null; messages: MessageProps[] }[];
    onSelectNode: (args: { name: string; mesh: Mesh }) => void;
    selectedNode?: string | null;
    orbit: boolean;
}

// type FeedType = { [nodeName: string]: { count: number; messages: MessageArrived[] | undefined } | undefined };
export const Graph3: FC<GraphProps> = ({ graph, onSelectNode, selectedNode, orbit }) => {
    const { viewport } = useThree();
    // const [messageState, setMessageState] = useState<FeedType>({});
    // const [selectedMesh, setSelectedMesh] = useState<Mesh | null>(null);
    // const scaleFactor = useScaleFactor(graph);
    // useEffect(
    //     () =>
    //         setMessageState((state: FeedType) =>
    //             feed
    //                 .filter((f) => !!f.to)
    //                 .reduce<FeedType>(
    //                     (p, c) => ({
    //                         ...p,
    //                         [c.to!]: {
    //                             messages: c.messages.map(
    //                                 (message, i) =>
    //                                     ({
    //                                         ...message,
    //                                         messageKey: `${message.messageKey}${
    //                                             i + ((state[c.to!] && state[c.to!]?.count) || 0)
    //                                         }) `,
    //                                         frame: clock.getElapsedTime() + (i / c.messages.length) * 5,
    //                                     } as MessageArrived)
    //                             ),
    //                             count: (state[c.to!]?.count || 0) + c.messages.length,
    //                         },
    //                     }),
    //                     state
    //                 )
    //         ),
    //     [feed, setMessageState, clock]
    // );
    // const scaledGraph = useGraphViewPort(graph);

    const onSelect = useCallback(
        (args: { name: string; mesh: Mesh }) => {
            onSelectNode(args);
            // setSelectedMesh(args.mesh);
        },
        [onSelectNode]
    );
    // const onEgress = useCallback(
    //     (fromNode: string, toNode: string, messages: MessageArrived[]) => {
    //         setMessageState((state: FeedType) => ({
    //             ...state,
    //             [fromNode]: { ...(state[fromNode] || { count: 0 }), messages: undefined },
    //             [toNode]: {
    //                 ...(state[toNode] || { count: 0 }),
    //                 messages: messages.map((m) => ({ ...m, frame: clock.getElapsedTime() })),
    //             },
    //         }));
    //     },
    //     [clock]
    // );
    // const edgesPerNode = useMemo(() => groupBy(graph.edges, (e) => e.from), [graph]);
    // const nodes = useMemo<LayoutNode3 & { edges: any[] }[]>(() => {
    //     return graph.nodes.map((node) => {
    //         const edges = (edgesPerNode[node.name] || []).map((edge) => ({
    //             ...edge,
    //             fromNode: edge.from,
    //             toNode: edge.to,
    //         }));
    //         return {
    //             ...nodes,
    //             edges,
    //         };
    //     });
    // }, [graph, edgesPerNode]);

    // const selectedNodeIndex = useMemo(() => {
    //     const index = scaledGraph.nodes.findIndex((f) => f.name === selectedNode);
    //     if (index >= 0) return index;
    //     return null;
    // }, [selectedNode, scaledGraph]);
    return (
        <>
            {/* <CameraRig
                orbit={orbit}
                targetPosition={
                    selectedNodeIndex === null
                        ? scalePoint(
                              new Vector3(
                                  (graph.minPoint.width[0] + graph.width[1]) / 2,
                                  (graph.size.height[0] + graph.height[1]) / 2,
                                  (graph.depth[0] + graph.depth[1]) / 2
                              ),
                              graph,
                              viewport.width,
                              viewport.height,
                              scaleFactor
                          )
                        : new Vector3(
                              nodes[selectedNodeIndex].position.x,
                              nodes[selectedNodeIndex].position.y,
                              nodes[selectedNodeIndex].position.z
                          )
                }
                distance={selectedNode === null ? 8 : 4.5}
            />
            {nodes.map((node) => (
                <Node key={node.name} {...node} />
            ))} */}
        </>
    );
};
