import React, { memo, useMemo, useRef } from "react";
import { extend } from "react-three-fiber";
import { Vector3 } from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { Wireframe } from "three/examples/jsm/lines/Wireframe";
import { WireframeGeometry2 } from "three/examples/jsm/lines/WireframeGeometry2";
import { NodeProps, useEdgesPositions, useMeshSelect, usePumpEdges } from "../hooks/message-hooks";
import { Edge } from "./edge";
import { Label } from "./label";
extend({ Wireframe, WireframeGeometry2, LineMaterial });

/** A basic graph node representing a step - generic */
export const Node = memo<NodeProps>(({ name, onSelect, width, height, depth, position, messages, edges, onEgress }) => {
    const nodeMidPosition = useMemo(() => position.clone().sub(new Vector3(0, 0, depth / -2)), [position, depth]);
    const edgeProps = useEdgesPositions(edges, name, position, 5, onEgress);
    const pump = usePumpEdges(edgeProps, messages);
    const zeroPos = useMemo(() => new Vector3(0, 0, 0), []);
    const [_onClick, meshRef] = useMeshSelect(name, onSelect);
    const mat = useRef<LineMaterial>();
    return (
        <group position={nodeMidPosition}>
            <mesh key="bounding" onClick={_onClick} ref={meshRef}>
                <boxGeometry attach="geometry" args={[width, height, depth]} />
                <meshBasicMaterial attach="material" transparent color={0x0a0b0b0} opacity={0.7} ref={mat} />
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
});
