import React, { FC, useCallback, useMemo, useState } from "react";
import { Vector3 } from "three";
import { Edge, EdgeProps } from "./edge";
import { MessageProps, MessageArrived } from "./messages";
import { SpinText } from "./spin-text";
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

function useCheckMessages(messages: MessageType[] | undefined) {
    const [elapsedTime, setElpased] = useState(0);
    useFrame(({ clock }) => {
        setElpased(Math.floor(clock.elapsedTime * 100) / 100);
    });
    return elapsedTime;
}

export const Node: FC<NodeProps> = ({ name, onSelect, width, height, position, messages, edges, onEgress }) => {
    const _onSelect = useCallback(({ text }: { text: string }) => onSelect({ name: text }), [onSelect]);
    const elapsed = useCheckMessages(messages);
    const edgeProps = useMemo<EdgeProps[]>(
        () =>
            edges.map(edge => ({
                ...edge,
                fromNode: { name },
                messages,
                elapsed,
                onEgress
            })),
        [edges, name, elapsed, messages, onEgress]
    );
    return (
        <>
            <SpinText
                key={name}
                onClick={_onSelect}
                text={name}
                spinY={0.0}
                color={"#202020"}
                width={width}
                height={height}
                backgroundColor="#a0a0ff"
                depth={width}
                position={position}
            />
            {edgeProps.map((edge, i) => (
                <Edge key={i} {...edge} />
            ))}
        </>
    );
};
