import React, { FC, useMemo } from "react";
import { CatmullRomCurve3 } from "three";

export interface MessageProps {
    messageKey: string;
    value?: number;
    content?: string;
}

export interface MessageArrived extends MessageProps {
    frame: number;
}

interface EdgeMessagesProps {
    curve: CatmullRomCurve3;
    messages: MessageArrived[] | undefined;
    duration: number;
    elapsed: number;
    prefix: string;
}

export const EdgeMessages: FC<EdgeMessagesProps> = ({ prefix, curve, elapsed, messages, duration }) => {
    const messageMeshes = useMemo(() => {
        return (messages || []).map(message => {
            return {
                key: message.messageKey,
                position: curve.getPointAt(Math.max(0, Math.min(1, (elapsed - message.frame) / duration))),
                color: message.messageKey[0] === "1" ? "#4070f0" : message.messageKey[0] === "2" ? "#f07040" : "#70f040"
            };
        });
    }, [elapsed, messages, curve, duration]);

    return (
        <>
            {messageMeshes.map((messageMesh, i) => {
                return (
                    <mesh key={prefix + i} position={messageMesh.position}>
                        <sphereGeometry attach="geometry" args={[0.076]} />
                        <meshPhongMaterial attach="material" color={messageMesh.color} />
                    </mesh>
                );
            })}
        </>
    );
};
