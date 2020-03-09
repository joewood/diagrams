import React, { memo, useCallback, useMemo, useState } from "react";
import { useFrame } from "react-three-fiber";
import { CatmullRomCurve3, Vector3 } from "three";
import { MessageArrived, NodeProps } from "../hooks/message-hooks";

import {
    useEgress,
    useExpiredMessages,
    useMessagePump,
    useUnexpiredMessages,
    useUpateState
} from "../hooks/message-hooks";
import { EdgeMessages } from "./messages";

export function usePointsToMakeCurve(points: Vector3[]) {
    return useMemo(() => {
        return new CatmullRomCurve3(points, false, "catmullrom");
    }, [points]);
}

/** this functions tracks message state based on a pump of messages
 * When messages expire the callback is called
 * It should be made generic for any object - it's a common pattern
 * The duration expiry condition could also be made generic, with an exit clause
 */
function useMessageState(
    messagePump: MessageArrived[] | undefined,
    duration: number,
    onEgressForNodePair: (messages: MessageArrived[]) => void
) {
    // add new messages from props
    const [messages, setMessages] = useMessagePump(messagePump);
    // get the unexpired messages based on the current time
    const unexpiredMessages = useUnexpiredMessages(messages, duration);
    // get the expired messages for edgress callback
    const expiredMessages = useExpiredMessages(messages, duration);
    // update the state for unexpired
    useUpateState(messages, unexpiredMessages, setMessages);
    // egress report expired messages
    useEgress(expiredMessages, onEgressForNodePair);
    return unexpiredMessages;
}

export interface EdgeProps extends Pick<NodeProps, "onEgress"> {
    /** Edge Key Points to the Node in World Coordinates */
    edgePoints: Vector3[];
    duration: number;
    fromNode: string;
    toNode: string;
    pumpMessages?: MessageArrived[];
}

export const Edge = memo<EdgeProps>(({ fromNode, toNode, pumpMessages, edgePoints, duration, onEgress }) => {
    const onEgressForNodePair = useCallback((messages: MessageArrived[]) => onEgress(fromNode, toNode, messages), [
        fromNode,
        toNode,
        onEgress
    ]);
    const [elapsedMs, setElapsedMs] = useState(0);
    useFrame(({ clock }) => {
        setElapsedMs(clock.elapsedTime);
    });
    const messagesKey = useMemo(() => `${fromNode}-${toNode}-messages`, [fromNode, toNode]);
    const meshKey = useMemo(() => `${fromNode}-${toNode}-edge`, [fromNode, toNode]);
    const unexpiredMessages = useMessageState(pumpMessages, duration, onEgressForNodePair);
    const edgeCurve = usePointsToMakeCurve(edgePoints);
    return (
        <>
            <mesh key={meshKey}>
                <tubeGeometry attach="geometry" args={[edgeCurve, 80, 0.03, 8, false]} />
                <meshPhongMaterial attach="material" color="#333" />
            </mesh>
            <EdgeMessages
                key={messagesKey}
                elapsed={elapsedMs}
                prefix={messagesKey}
                curve={edgeCurve}
                duration={duration}
                messages={unexpiredMessages}
            />
        </>
    );
});
