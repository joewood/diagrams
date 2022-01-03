// import { MessageProps, MessageArrived } from "./messages";
import { Text as TT } from "@graph3d/three-utils";
import { Billboard, RoundedBox, Text } from "@react-three/drei";
import React, { FC, RefObject, useCallback, useMemo, useRef } from "react";
import { Mesh, Vector3 } from "three";
import { Edge, EdgeProps } from "./edge";

export type NodeEdgeType = Pick<EdgeProps, "points" | "toNode">;
export type NodeType = Pick<NodeProps, "name">;
// export type MessageType = Pick<MessageProps, "messageKey">;

export interface NodeEdge {
    to: string;
    points: Vector3;
}

export interface NodeProps {
    position: Vector3;
    type: string;
    width: number;
    height: number;
    depth: number;
    name: string;
    edges: NodeEdgeType[];
    // messages: MessageArrived[] | undefined;
    // onEgress: (fromNode: string, toNode: string, messages: MessageArrived[]) => void;
    onSelect: (args: { name: string; mesh: Mesh }) => void;
}

// export function useCheckMessages(messages: MessageType[] | undefined) {
//     const [elapsedTime, setElapsed] = useState(0);
//     useFrame(({ clock }) => {
//         setElapsed(Math.floor(clock.elapsedTime * 100) / 100);
//     });
//     return elapsedTime;
// }
interface LabelProps {
    name: string;
    width: number;
    depth: number;
    height: number;
    position: Vector3;
    onSelect: (args: { name: string; mesh: Mesh }) => void;
}

export const Label: FC<LabelProps> = ({ name, position, width, height, depth, onSelect }) => {
    const ref = useRef<Mesh>() as RefObject<Mesh>;
    const _onSelect = useCallback(
        ({ text }: { text: string }) => ref.current && onSelect({ name: text, mesh: ref.current }),
        [onSelect]
    );
    const pos = useMemo(() => new Vector3(position.x, position.y, position.z - depth / 2), [position, depth]);
    const pos2 = useMemo(() => new Vector3(position.x, position.y + 0.1, position.z - depth / 2), [position, depth]);
    return (
        <>
            <RoundedBox args={[width, height * 1, depth]} radius={0.1} smoothness={4} position={pos}>
            <meshStandardMaterial
                    roughness={0.2}
                    metalness={0.8}
                    attachArray="material"
                >
                    </meshStandardMaterial>
                {/* <meshPhongMaterial attach="material" color="#f3f3f3" /> */}
            </RoundedBox>
            <Billboard
                position={pos2}
                follow={true}
                lockX={false}
                lockY={false}
                lockZ={false} // Lock the rotation on the z axis (default=false)
            >
                <Text fontSize={0.1}>{name}</Text>
            </Billboard>
            {/* <TT
                key={name}
                ref={ref}
                onClick={_onSelect}
                text={name}
                color={"#202020"}
                width={width}
                height={height * 0.25}
                backgroundColor="#a0a0ff"
                depth={depth}
                position={pos}
            /> */}
        </>
    );
};

export const Edges: FC<{ edges: EdgeProps[] }> = ({ edges }) => (
    <>
        {edges.map((edge) => (
            <Edge key={`${edge.fromNode}-${edge.toNode}-edge`} {...edge} />
        ))}
    </>
);

export const Node: FC<NodeProps> = ({ name, onSelect, width, height, depth, position, edges }) => {
    // const elapsed = useCheckMessages(messages);
    const edgeProps = useEdges(edges, name);
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
    name: string
    // messages: MessageArrived[] | undefined,
    // elapsed: number,
    // onEgress: (fromNode: string, toNode: string, messages: MessageArrived[]) => void
) {
    return useMemo<EdgeProps[]>(
        () =>
            edges.map((edge) => ({
                ...edge,
                // duration: edge.duration, //+ Math.floor(Math.random() * 4),
                fromNode: name,
                // messages,
                // elapsed,
                // onEgress
            })),
        [edges, name]
    );
}
