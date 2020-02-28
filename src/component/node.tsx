import React, { FC, useCallback, useMemo, useState } from "react";
import { Vector3 } from "three";
import { Edge, EdgeProps } from "./edge";
import { MessageProps, MessageArrived } from "./messages";
import { Text } from "../three-utils/text";
import { useFrame } from "react-three-fiber";

export type NodeEdgeType = Pick<EdgeProps, "duration" | "messages" | "points" | "toNode">;
export type NodeType = Pick<NodeProps, "name">;
export type MessageType = Pick<MessageProps, "messageKey">;

export interface NodeEdge {
    to: string;
    points: Vector3;
}

export interface NodeProps {
    position: Vector3;
    width: number;
    height: number;
    depth: number;
    name: string;
    edges: NodeEdgeType[];
    messages: MessageArrived[] | undefined;
    onEgress: (fromNode: NodeType, toNode: NodeType, messages: MessageArrived[]) => void;
    onSelect: (args: NodeType) => void;
}

export function useCheckMessages(messages: MessageType[] | undefined) {
    const [elapsedTime, setElpased] = useState(0);
    useFrame(({ clock }) => {
        setElpased(Math.floor(clock.elapsedTime * 100) / 100);
    });
    return elapsedTime;
}
interface LabelProps {
    name: string;
    width: number;
    depth: number;
    height: number;
    position: Vector3;
    onSelect: (x: { name: string }) => void;
}

export const Label: FC<LabelProps> = ({ name, position, width, height, depth, onSelect }) => {
    const _onSelect = useCallback(({ text }: { text: string }) => onSelect({ name: text }), [onSelect]);
    return (
        <Text
            key={name}
            onClick={_onSelect}
            text={name}
            color={"#202020"}
            width={width}
            height={height * 0.25}
            backgroundColor="#a0a0ff"
            depth={depth}
            position={new Vector3(position.x, position.y, position.z - depth / 2)}
        />
    );
};

export const Edges: FC<{ edges: EdgeProps[] }> = ({ edges }) => (
    <>
        {edges.map(edge => (
            <Edge key={`${edge.fromNode.name}-${edge.toNode.name}-edge`} {...edge} />
        ))}
    </>
);

export const Node: FC<NodeProps> = ({ name, onSelect, width, height, depth, position, messages, edges, onEgress }) => {
    const elapsed = useCheckMessages(messages);
    const edgeProps = useEdges(edges, name, messages, elapsed, onEgress);
    return (
        <>
            <Label
                key="label"
                name={name}
                onSelect={onSelect}
                width={width}
                height={height}
                depth={Math.abs(depth)}
                position={position}
            />
            <Edges edges={edgeProps} />
        </>
    );
};

export function useEdges(
    edges: NodeEdgeType[],
    name: string,
    messages: MessageArrived[] | undefined,
    elapsed: number,
    onEgress: (fromNode: Pick<NodeProps, "name">, toNode: Pick<NodeProps, "name">, messages: MessageArrived[]) => void
) {
    return useMemo<EdgeProps[]>(
        () =>
            edges.map(edge => ({
                ...edge,
                duration: edge.duration, //+ Math.floor(Math.random() * 4),
                fromNode: { name },
                messages,
                elapsed,
                onEgress
            })),
        [edges, name, elapsed, messages, onEgress]
    );
}
