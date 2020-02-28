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
    // const color = useMemo(() => {
    //     const key = messages && messages.length > 0 && messages[0].messageKey;
    //     if (!key) return "#fff";
    //     return key[0] === "1" ? "#4070f0" : key[0] === "2" ? "#f07040" : "#70f040";
    // }, [messages]);
    const animPoints = useMemo(() => {
        return (messages || []).map(message => {
            return {
                key: message.messageKey,
                pt: curve.getPointAt(Math.max(0, Math.min(1, (elapsed - message.frame) / duration))),
                color: message.messageKey[0] === "1" ? "#4070f0" : message.messageKey[0] === "2" ? "#f07040" : "#70f040"
            };
        });
    }, [elapsed, messages, curve, duration]);

    return (
        <>
            {animPoints.map((point, i) => {
                return (
                    <mesh key={prefix + i} position={point.pt}>
                        <sphereGeometry attach="geometry" args={[0.076]} />
                        <meshPhongMaterial attach="material" color={point.color} />
                    </mesh>
                );
            })}
        </>
    );
};
