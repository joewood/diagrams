import React, { FC, useMemo } from "react";
import { NodeProps, useEdgesPositions, usePumpEdges, useMeshSelect } from "../hooks/message-hooks";
import { SvgMesh } from "../three-utils/svg-mesh";
import logo from "../kafka.svg";
import { Vector3 } from "three";
import { Label } from "../component/label";
import { Edge } from "../component/edge";

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
            <SvgMesh drawFillShapes drawStrokes url={logo} scale={width} position={new Vector3(0, height / 3, 0)} />
            {/* <mesh position={zeroPos}>
                <boxGeometry attach="geometry" args={[width, height, depth]} />
                <lineBasicMaterial attach="material" args={[0x0808080, 1, "round", "round"]} />
            </mesh> */}

            {pump?.map(edge => (
                <Edge key={`${name}-${edge.toNode}-edge`} {...edge} />
            ))}
        </group>
    );
};
