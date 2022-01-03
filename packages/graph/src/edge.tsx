import * as React from "react";
import { FC, useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
// import { EdgeMessages, MessageArrived } from "./messages";
import { NodeProps } from "./node";

export function usePath(points: Vector3[]) {
    return useMemo(() => {
        return new CatmullRomCurve3(points, false, "catmullrom");
    }, [points]);
}

// function useTrackMessages(
//     messagePump: MessageArrived[] | undefined,
//     duration: number,
//     elapsedTime: number,
//     onEgress: (messages: MessageArrived[]) => void
// ) {
//     const [messages, setMessages] = useState<MessageArrived[] | undefined>(
//         undefined
//     );
//     useEffect(() => {
//         if (!messagePump || messagePump.length === 0) return;
//         // console.log("New messages: " + JSON.stringify(messagePump));
//         setMessages((msg) => [...(msg || []), ...messagePump]);
//     }, [messagePump, duration]);
//     const unexpiredMessages = useMemo<MessageArrived[]>(() => {
//         if (!messages || messages.length === 0) return [];
//         const m = messages[0];
//         if (elapsedTime >= m.frame + duration) {
//             return messages.filter((m) => elapsedTime < m.frame + duration);
//         } else {
//             return messages;
//         }
//     }, [messages, duration, elapsedTime]);

//     const expiredMessages = useMemo(() => {
//         const emptyArray: MessageArrived[] = [];
//         if (!messages || messages.length === 0) {
//             return emptyArray;
//         }
//         const m = messages[0];
//         if (elapsedTime >= m.frame + duration) {
//             // console.log("Filtering ");
//             return messages.filter((m) => elapsedTime >= m.frame + duration);
//         } else return emptyArray;
//     }, [messages, duration, elapsedTime]);

//     useEffect(() => {
//         if (!expiredMessages || expiredMessages.length === 0) return;
//         const keyed = keyBy(expiredMessages, (m) => m.messageKey);
//         setMessages((msg) => (msg || []).filter((m) => !keyed[m.messageKey]));
//     }, [expiredMessages]);

//     useEffect(() => {
//         // console.log({ elapsedTime });
//         if (!expiredMessages || expiredMessages.length === 0) return;
//         // console.log("Time to delete: " + expiredMessages.length + " " + messages?.length);
//         onEgress(expiredMessages);
//     }, [duration, expiredMessages, onEgress]);
//     return unexpiredMessages;
// }

export interface EdgeProps  {
    points: Vector3[];
    // duration: number;
    fromNode: string;
    toNode: string;
    // elapsed: number;
    // messages?: MessageArrived[];
}

export const Edge: FC<EdgeProps> = ({
    fromNode,
    toNode,
    // messages,
    points,
    // duration,
    // elapsed,
    // onEgress,
}) => {
    // const _onEgress = useCallback(
    //     (messages: MessageArrived[]) => onEgress(fromNode, toNode, messages),
    //     [fromNode, toNode, onEgress]
    // );
    // const [elapsedMs, setElapsedMs] = useState(0);
    // useFrame(({ clock }) => {
    //     setElapsedMs(clock.elapsedTime);
    // });

    // const messagesBuffered = useTrackMessages(
    //     messages,
    //     duration,
    //     elapsed,
    //     _onEgress
    // );
    const curve = usePath(points);
    return (
        <>
            <mesh key={`${fromNode}-${toNode}-edge`}>
                <tubeGeometry
                    attach="geometry"
                    args={[curve, 80, 0.03, 8, false]}
                />
                <meshPhongMaterial attach="material" color="#333" />
            </mesh>
            {/* <EdgeMessages
                key={`${fromNode}-${toNode}-messages`}
                elapsed={elapsedMs}
                prefix={`${fromNode}-${toNode}-messages`}
                curve={curve}
                duration={duration}
                messages={messagesBuffered}
            /> */}
        </>
    );
};
