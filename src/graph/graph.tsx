import { groupBy } from "lodash";
import React, { FC, useCallback, useMemo, useState, useEffect } from "react";
import { useThree } from "react-three-fiber";
import { Vector3 } from "three";
import { MessageArrived, MessageProps } from "../component/messages";
import { Node, NodeEdgeType, NodeProps, NodeType } from "../component/node";
import { CameraRig } from "../three-utils/camera-rig";
import { Layout, useGraphViewPort, useScaleFactor, scalePoint } from "./use-graph-viewport";

// extend({ OrbitControls })

// function Controls() {
// 	const controls = useRef() as any //Ref<ReactThreeFiber.Object3DNode<OrbitControls,typeof OrbitControls>>
// 	const { camera, gl } = useThree()
// 	useFrame(() => controls && controls.current && controls.current.update())
// 	return (
// 		<orbitControls ref={controls} args={[camera, gl.domElement]} enableDamping dampingFactor={0.1} rotateSpeed={0.5} />
// 	)
// }

interface GraphProps {
    graph: Layout;
    feed: { to: string | null; messages: MessageProps[] }[];
    onSelectNode: (args: { text: string }) => void;
    selectedNode?: string | null;
}

type FeedType = { [nodeName: string]: { count: number; messages: MessageArrived[] | undefined } | undefined };
export const Graph: FC<GraphProps> = ({ graph, onSelectNode, selectedNode, feed }) => {
    const { clock, viewport } = useThree();
    const [messageState, setMessageState] = useState<FeedType>({});
    const scaleFactor = useScaleFactor(graph);
    useEffect(
        () =>
            setMessageState((state: FeedType) =>
                feed
                    .filter(f => !!f.to)
                    .reduce<FeedType>(
                        (p, c) => ({
                            ...p,
                            [c.to!]: {
                                messages: c.messages.map(
                                    (message, i) =>
                                        ({
                                            ...message,
                                            messageKey: `${message.messageKey}${i +
                                                ((state[c.to!] && state[c.to!]?.count) || 0)}) `,
                                            frame: clock.getElapsedTime() + (i / c.messages.length) * 5
                                        } as MessageArrived)
                                ),
                                count: ((state[c.to!] && state[c.to!]?.count) || 0) + c.messages.length
                            }
                        }),
                        state
                    )
            ),
        [feed, setMessageState, clock]
    );
    const scaledGraph = useGraphViewPort(graph);

    const onSelect = useCallback(
        ({ name }: NodeType) => {
            onSelectNode({ text: name });
        },
        [onSelectNode]
    );
    const onEgress = useCallback(
        (fromNode: NodeType, toNode: NodeType, messages: MessageArrived[]) => {
            setMessageState((state: FeedType) => ({
                ...state,
                [fromNode.name]: { ...(state[fromNode.name] || { count: 0 }), messages: undefined },
                [toNode.name]: {
                    ...(state[toNode.name] || { count: 0 }),
                    messages: messages.map(m => ({ ...m, frame: clock.getElapsedTime() }))
                }
            }));
        },
        [clock]
    );
    const edgesPerNode = useMemo(() => groupBy(scaledGraph.edges, e => e.from), [scaledGraph]);
    const nodes = useMemo(() => {
        return scaledGraph.nodes.map<NodeProps>(node => {
            const edges = (edgesPerNode[node.name] || []).map<NodeEdgeType>(edge => ({
                points: edge.points,
                duration: 5,
                fromNode: { name: edge.from },
                toNode: { name: edge.to },
                onEgress
            }));
            return {
                position: node.position,
                name: node.name,
                onEgress,
                width: node.width,
                height: node.height,
                depth: node.depth,
                onSelect: onSelect,
                messages: (messageState[node.name] && messageState[node.name]?.messages) || undefined,
                edges
            };
        });
    }, [scaledGraph, onSelect, messageState, onEgress, edgesPerNode]);

    const selectedNodeIndex = useMemo(() => {
        const index = scaledGraph.nodes.findIndex(f => f.name === selectedNode);
        if (index >= 0) return index;
        return null;
    }, [selectedNode, scaledGraph]);
    return (
        <>
            <CameraRig
                targetPosition={
                    selectedNodeIndex === null
                        ? scalePoint(
                              new Vector3(
                                  (graph.width[0] + graph.width[1]) / 2,
                                  (graph.height[0] + graph.height[1]) / 2,
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
            {nodes.map((node, i) => (
                <Node key={node.name} {...node} />
            ))}
        </>
    );
};
