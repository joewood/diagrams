import React, { FC } from "react";
import { Edges, Label, NodeProps, useCheckMessages, useEdges } from "./node";

export const BrokerQueueNode: FC<NodeProps> = ({
    name,
    onSelect,
    width,
    height,
    depth,
    position,
    messages,
    edges,
    onEgress
}) => {
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
                depth={depth}
                position={position}
            />
            <Edges edges={edgeProps} />
        </>
    );
};
