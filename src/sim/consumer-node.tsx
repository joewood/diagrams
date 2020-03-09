import React, { memo, useMemo, useRef, useCallback, Ref, RefObject } from "react";
import { Vector3, Mesh } from "three";
import { Edge } from "../component/edge";
import { Label } from "../component/label";
import { NodeProps, useEdgesPositions, usePumpEdges, useMeshSelect } from "../hooks/message-hooks";

interface ConsumerNode extends NodeProps {
    maxProcessingTime: number;
}

export const ConsumerNode = memo<ConsumerNode>(
    ({
        name,
        onSelect,
        width,
        height,
        depth,
        position,
        messages,
        maxProcessingTime,
        edges,
        onEgress,
        type = "consumer-node"
    }) => {
        const nodeMidPosition = useMemo(() => position.clone().sub(new Vector3(0, 0, depth / -2)), [position, depth]);
        const edgeProps = useEdgesPositions(edges, name, position, 5, onEgress);
        const pump = usePumpEdges(edgeProps, messages);
        const zeroPos = useMemo(() => new Vector3(0, 0, 0), []);
        const [_onClick, meshRef] = useMeshSelect(name, onSelect);

        return (
            <group position={nodeMidPosition}>
                <mesh key="bounding" ref={meshRef} onClick={_onClick}>
                    <boxGeometry attach="geometry" args={[width, height, depth]} />
                    <meshBasicMaterial attach="material" transparent color={0x0a0b0b0} opacity={0.7} />
                </mesh>
                <Label
                    key="label"
                    name={name}
                    onClick={_onClick}
                    width={width}
                    height={height}
                    depth={Math.abs(depth)}
                    position={zeroPos}
                />
                {pump?.map(edge => (
                    <Edge key={`${name}-${edge.toNode}-edge`} {...edge} />
                ))}
            </group>
        );
    }
);
