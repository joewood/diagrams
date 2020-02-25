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

interface MessagesProps {
    curve: CatmullRomCurve3;
    messages: MessageArrived[] | undefined;
    duration: number;
    elapsed: number;
    prefix: string;
}

export const Messages: FC<MessagesProps> = ({ prefix, curve, elapsed, messages, duration }) => {
    const animPoints = useMemo(() => {
        return (messages || []).map(message => {
            return {
                key: message.messageKey,
                pt: curve.getPointAt(Math.max(0, Math.min(1, (elapsed - message.frame) / duration)))
            };
        });
    }, [elapsed, messages, curve, duration]);

    return (
        <>
            {animPoints.map((point, i) => {
                return (
                    <mesh key={prefix + i} position={point.pt}>
                        <sphereGeometry attach="geometry" args={[0.076]} />
                        <meshPhongMaterial attach="material" color="#4070f0" />
                    </mesh>
                );
            })}
        </>
    );
};
