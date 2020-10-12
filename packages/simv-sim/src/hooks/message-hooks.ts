import { Dispatch, SetStateAction, useEffect, useState, useMemo, useRef, useCallback, RefObject } from "react";
import { useThree } from "react-three-fiber";
import { Vector3, Mesh } from "three";

export type NodeEdgeType = Pick<EdgeProps, "edgePoints" | "toNode">;
export type NodeType = Pick<NodeProps, "name">;
export type MessageType = Pick<MessageProps, "messageKey">;

export interface EdgeProps extends Pick<NodeProps, "onEgress"> {
    /** Edge Key Points to the Node in World Coordinates */
    edgePoints: Vector3[];
    duration: number;
    fromNode: string;
    toNode: string;
    pumpMessages?: MessageArrived[];
}

export interface NodeEdge {
    to: string;
    points: Vector3;
}

export interface MessageProps {
    messageKey: string;
    value?: number;
    content?: string;
}

/** A message with a starting reference point */
export interface MessageArrived extends MessageProps {
    frame: number;
    index: number;
}

/** Mandatory interface for all Graph Nodes */
export interface NodeProps {
    /** Position of the node. Center position. */
    position: Vector3;
    type: string;
    width: number;
    height: number;
    depth: number;
    name: string;
    edges: NodeEdgeType[];
    messages: MessageArrived[] | undefined;
    onEgress: (fromNode: string, toNode: string, messages: MessageArrived[]) => void;
    onSelect: (args: { name: string; mesh: Mesh }) => void;
}

type Indexed = { index: number };
type NullableArray<T> = T[] | undefined;
type StateSetState<T> = [T[], Dispatch<SetStateAction<T[]>>];
/** Simple hook to help use a property to append state to a component.
 * Prop should ensure it follows Memoized rules. A new reference object means a new set of messages.
 * Each new message has an unique incremental index
 */
export function useMessagePump<T>(messagePump: NullableArray<T>): StateSetState<T & Indexed> {
    type IndexedMessage = Indexed & T;
    const [messages, setMessages] = useState<IndexedMessage[]>([]);
    const [total, setTotal] = useState(0);
    const [prevPump, setPrevPump] = useState<NullableArray<T>>();
    useEffect(() => {
        if (!messagePump || messagePump.length === 0 || messagePump === prevPump) return;
        setPrevPump(messagePump);
        setMessages((msg) => [...(msg || []), ...messagePump.map((m, i) => ({ ...m, index: i + total }))]);
        setTotal((total) => total + messagePump.length);
    }, [messagePump, total, setPrevPump, setMessages, setTotal, prevPump]);
    return [messages, setMessages];
}

/** Simple hook to efficiently return the set of messages that have not expired past the duration+frame */
export function useUnexpiredMessages<T extends { frame: number }>(
    messages: T[] | undefined,
    duration: number
): T[] | undefined {
    const {
        clock: { elapsedTime },
    } = useThree();
    if (!messages || messages.length === 0) return undefined;
    const m = messages[0];
    if (elapsedTime >= m.frame + duration) {
        return messages.filter((m) => elapsedTime < m.frame + duration);
    } else {
        return messages;
    }
}

/** Hook to return the subset of expired messages (message.frame+duration > now)
 * @param messages ordered array of messages with the oldest first
 */
export function useExpiredMessages<T extends { frame: number }>(
    messages: T[] | undefined,
    duration: number
): T[] | undefined {
    const {
        clock: { elapsedTime },
    } = useThree();
    if (!messages || messages.length === 0) return undefined;
    const m = messages[0];
    if (elapsedTime >= m.frame + duration) {
        return messages.filter((m) => elapsedTime >= m.frame + duration);
    } else return undefined;
}

/** Potentially pointless hook that changes updates state only when the state is different to current state */
export function useUpateState<T>(
    currentState: T[] | undefined,
    newState: T[] | undefined,
    setState: Dispatch<SetStateAction<T[] | undefined>>
) {
    useEffect(() => {
        if (currentState !== newState) {
            setState((oldState) => newState);
        }
    }, [newState, currentState, setState]);
}

/** Simple hook that invokes the callback for a collection when it has changed */
export function useEgress<T>(expiredMessages: T[] | undefined, onEgress: (messages: T[]) => void) {
    useEffect(() => {
        if (!expiredMessages || expiredMessages.length === 0) return;
        onEgress(expiredMessages);
    }, [expiredMessages, onEgress]);
}

/** A transform hook returning edge points relative to the source node */
export function useEdgesPositions(
    edges: NodeEdgeType[] | undefined,
    fromNode: string,
    nodePosition: Vector3,
    duration: number,
    onEgress: (fromNode: string, toNode: string, messages: MessageArrived[]) => void
) {
    return useMemo(
        () =>
            edges?.map<EdgeProps>(({ toNode, edgePoints }) => ({
                edgePoints: edgePoints.map((edgePoint) => edgePoint.clone().sub(nodePosition)),
                duration,
                fromNode,
                toNode,
                onEgress,
            })),
        [edges, fromNode, nodePosition, duration, onEgress]
    );
}

export function usePumpEdges(edges: EdgeProps[] | undefined, messages: MessageArrived[] | undefined) {
    return useMemo(
        () =>
            edges?.map<EdgeProps>((edge) => ({
                ...edge,
                pumpMessages: messages?.map((msg) => ({ ...msg })),
            })),
        [edges, messages]
    );
}

export function useMeshSelect(name: string, onSelect: (args: { name: string; mesh: Mesh }) => void) {
    const meshRef = useRef<Mesh>() as RefObject<Mesh>;
    const _onClick = useCallback(() => {
        if (meshRef.current) onSelect({ name, mesh: meshRef.current });
    }, [meshRef, name, onSelect]);
    return [_onClick, meshRef] as [typeof _onClick, RefObject<Mesh>];
}
