import React, { FC, useMemo, memo, useRef } from "react";
import { Mesh, Vector3 } from "three";
import { MessageArrived } from "../hooks/message-hooks";
import { useFrame } from "react-three-fiber";
import { usePointsToMakeCurve } from "./edge";

interface EdgeMessageProps {
    /** Key points for the Edge */
    edgePoints: Vector3[];
    /** Duration of the animation seconds */
    duration: number;
    /** Starting frame number */
    frame: number;
    /** Color of the message */
    color: string;
}

/** A single message inside an Edge */
export const EdgeMessage = memo<EdgeMessageProps>(({ edgePoints, frame, duration, color }) => {
    const ref = useRef<Mesh>();
    const edgeCurve = usePointsToMakeCurve(edgePoints);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const elapsed = clock.elapsedTime;
        const pt = edgeCurve.getPointAt(Math.max(0, Math.min(1, (elapsed - frame) / duration)));
        ref.current.position.set(pt.x, pt.y, pt.z);
    });
    return (
        <mesh ref={ref}>
            <sphereGeometry attach="geometry" args={[0.076]} />
            <meshPhongMaterial attach="material" color={color} />
        </mesh>
    );
});

interface EdgeMessagesProps {
    /** Key points for the edge */
    edgePoints: Vector3[];

    messages: MessageArrived[] | undefined;
    duration: number;
    prefix: string;
}

/** A set of messages inside an Edge */
export const EdgeMessages: FC<EdgeMessagesProps> = ({ prefix, edgePoints, messages, duration }) => {
    const messageMeshes = useMemo(() => {
        return (messages || []).map(message => {
            return {
                key: message.messageKey,
                // position: curve.getPointAt(Math.max(0, Math.min(1, (elapsed - message.frame) / duration))),
                color:
                    message.messageKey[0] === "1" ? "#4070f0" : message.messageKey[0] === "2" ? "#f07040" : "#70f040",
                frame: message.frame
            };
        });
    }, [messages]);

    return (
        <>
            {messageMeshes.map((messageMesh, i) => {
                return (
                    <EdgeMessage
                        key={prefix + i}
                        edgePoints={edgePoints}
                        duration={duration}
                        color={messageMesh.color}
                        frame={messageMesh.frame}
                    />
                );
            })}
        </>
    );
};
