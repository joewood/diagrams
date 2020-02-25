import { groupBy } from "lodash";
import React, { FC, useCallback, useMemo, useState } from "react";
import { Vector3 } from "three";
import { CameraRig } from "./camera-rig";
import { MessageProps, MessageArrived } from "./messages";
import { MessageType, Node, NodeProps, NodeType, NodeEdgeType } from "./node";
import { Layout, useGraphViewPort } from "./use-graph-viewport";
import { useThree } from "react-three-fiber";

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
    feed: { to: string; messages: MessageProps[] };
    onSelectNode: (args: { text: string }) => void;
    selectedNode?: string | null;
}

export const Graph: FC<GraphProps> = ({ graph, onSelectNode, selectedNode, feed }) => {
    const { clock } = useThree();
    const [messageState, setMessageState] = useState<{ [nodeName: string]: MessageArrived[] | undefined }>({
        [feed.to]: feed.messages.map((m, i) => ({
            ...m,
            frame: clock.getElapsedTime() + (i / feed.messages.length) * 5
        }))
    });
    const scaledGraph = useGraphViewPort(graph);

    const onSelect = useCallback(
        ({ name }: NodeType) => {
            onSelectNode({ text: name });
        },
        [onSelectNode]
    );
    const onEgress = useCallback(
        (fromNode: NodeType, toNode: NodeType, messages: MessageArrived[]) => {
            // console.log(
            //     "Egress: " + fromNode.name + " " + toNode.name + " " + messages.length + " " + clock.getElapsedTime()
            // );
            setMessageState(state => ({
                ...state,
                [fromNode.name]: undefined,
                [toNode.name]: messages.map(m => ({ ...m, frame: clock.getElapsedTime() }))
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
                width: node.width || 10,
                height: node.height || 10,
                depth: node.width || 10,
                onSelect: onSelect,
                messages: messageState[node.name],
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
                        ? new Vector3(0, 0, 0.5)
                        : new Vector3(
                              nodes[selectedNodeIndex].position.x,
                              nodes[selectedNodeIndex].position.y,
                              nodes[selectedNodeIndex].position.z
                          )
                }
            />
            {nodes.map((node, i) => (
                <Node key={node.name} {...node} />
            ))}
        </>
    );
};
