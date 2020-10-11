import React, { FC, useEffect, useState, useMemo, Dispatch, useReducer } from "react";
import { Vector3, Clock } from "three";
import { Layout, PositionedEdge } from "../graph/use-graph-viewport";
import { useMessagePump, MessageProps, useExpiredMessages, useUnexpiredMessages } from "../hooks/message-hooks";
import { EdgeMessage, EdgeMessages } from "./messages";
import { Dictionary, groupBy, flatten, mapKeys, mapValues } from "lodash";
import { useThree } from "react-three-fiber";

const edgeDuration = 1;
const nodeDuration = 0.2;

/** Properties indicating which node owns the message */
interface InNode {
    node: string;
}

interface MessageFlowProps {
    messagePump: (MessageProps & InNode)[] | undefined;
    graph: Layout;
}

interface InState {
    frame: number;
    message: MessageProps;
    // duration: number;
    // index: number;
}

/** A message is travelling along an edge */
interface InEdgeState extends InState {
    // fromNode: string;
    // to: string;
}

/** A message is inside a node, ready to be dispatched to any number of edges */
interface InNodeState extends InState {
    // node: string;
    partition?: number;
    path: Vector3[];

    // edgePoints: Vector3[];
}

function createInEdgeStates(inNodeState2: [InNodeState, PositionedEdge], clock: Clock) {
    const [inNodeState, edge] = inNodeState2;
    return {
        from: edge.from,
        to: edge.to,
        edgePoints: edge.edgePoints,
        duration: edgeDuration,
        frame: clock.getElapsedTime(),
        fromNode: edge.from,
        index: 0,
        message: inNodeState.message,
    };
}

type EgressFunction = (fromNode: string, toNode: string) => boolean;
/** Hook to return the subset of expired messages (message.frame+duration > now)
 * @param expiredInNodeStates ordered array of messages with the oldest first
 */
function useReadyToEgress(
    expiredInNodeStates: InNodeState[] | undefined,
    edgesPerNode: Dictionary<PositionedEdge[]>,
    egressFunction: EgressFunction
): [InNodeState, PositionedEdge][] | undefined {
    const nodeEdgePairs = useMemo(() => {
        if (!expiredInNodeStates || expiredInNodeStates.length === 0) return undefined;
        return expiredInNodeStates.map((inNodeState) => {
            let edges = edgesPerNode[inNodeState.node];
            if (!edges || edges.length === 0) return [];
            return edges
                .filter((edge) => egressFunction(edge.from, edge.to))
                .map<[InNodeState, PositionedEdge]>((edge) => [inNodeState, edge]);
        });
    }, [edgesPerNode, egressFunction, expiredInNodeStates]);
    if (nodeEdgePairs === undefined) return nodeEdgePairs;
    else return flatten(nodeEdgePairs);
}

type RemoveFunction = (fromNode: string, toNode: string) => boolean;
function useStayInNodeState(
    inNodeStates: InNodeState[] | undefined,
    expiredInNodeStates: InNodeState[] | undefined,
    edgesPerNode: Dictionary<PositionedEdge[]>,
    removeFunction: RemoveFunction
) : InNodeState[] | undefined
{
    return useMemo( () => {
        if (!expiredInNodeStates || expiredInNodeStates.length===0) return inNodeStates;
        
        const remove = expiredInNodeStates.filter( e => {
            const edges = edgesPerNode[e.node];
            if (!edges || edges.length===0) return undefined;
            return edges.filter( ee => removeFunction( e.node, ee.to));
        })
        if (remove.length===0) return inNodeStates;

    },[inNodeStates,expiredInNodeStates])
}


function createInNodeState(inEdgeState: InEdgeState, clock: Clock): InNodeState {
    const { to, index, message } = inEdgeState;
    return {
        node: to,
        message: message,
        frame: clock.elapsedTime,
        duration: nodeDuration,
        index: index,
        edgePoints: [inEdgeState.edgePoints[inEdgeState.edgePoints.length - 1], new Vector3(20, 20, -20)],
        partition: 0,
    };
}

function edgeKey( edge: PositionedEdge ) : string {
    return `${edge.from}~${edge.to}`
}

interface EdgeState {
    edge: PositionedEdge;
    messages: InEdgeState[];
}


type EdgeAction = {
    type: "ADD_MESSAGES",
    value: {
        messages:(MessageProps & InNode)[];
        frame: number;
    }
}

function edgeStateReducer( state: Dictionary<EdgeState>, action: EdgeAction) : Dictionary<EdgeState>{
    switch(action.type) {
        case "ADD_MESSAGES":
            return pumpedMessages.map<InNodeState>((newMessage) => ({
                frame: clock.getElapsedTime() - nodeDuration,
                message: newMessage,
                duration: nodeDuration,
                node: newMessage.node,
                partition: 0,
                edgePoints: [new Vector3(0, 0, 0), new Vector3(10, 0, 0)],
            }));
                break;
        default: 
            return state;
    }
}

interface NodeState {
    node: string;
    messages: InNodeState[];
}

type NodeAction = {
    type: "ADD_MESSAGES",
    messages:(MessageProps & InNode)[];
    frame: number;
}

function nodeStateReducer( state: Dictionary<NodeState>, action: NodeAction): Dictionary<NodeState> {
    switch(action.type) {
        case "ADD_MESSAGES":
            if (action.messages.length===0) return state;
            const { messages, frame} = action;
            const groupedPumped = groupBy( messages, m=>m.node);
            const newState = mapValues(groupedPumped, (messages,key)=> {
                const oldNodeState : NodeState = state[key] || { node:key, messages:[]}
                const newMessageState = messages.map<InNodeState>( message => ({message,frame, path: [new Vector3(-10,0,0),new Vector3(10,0,0)]}))
                return {...oldNodeState, messages: [...oldNodeState.messages, ...newMessageState]} as NodeState;
            }
            return newState;
        default:
            return state;
    }
}


/** Renders the state of all messages in the system */
export const MessageFlow: FC<MessageFlowProps> = ({ messagePump, graph }) => {
    const [pumpedMessages] = useMessagePump(messagePump);
    const [inEdgeState, edgeStateDispatcher] = useReducer(edgeStateReducer,{});
    const [inNodeState, nodeStateDispatcher] = useReducer(nodeStateReducer,{});
    const { clock } = useThree();
    const edgesPerNode = useMemo(() => groupBy(graph.edges, (e) => e.from), [graph]);

    /*
    For a set of messages, run through the node stages with a condition at each step.
    The output of the groupby should be a set of messages for each edge with starting frame. When the message
    has traveled the edge the next condition should be met before proceeding. 
    1. Messages pumped to a node
    2. New messages queued on node - kept in state. Set frame to current time. Do we need an index?
    3. When complete - ready to send
    4. Iterate over connected edges, create new state for each edge
    5. When complete - go back to next node
    */

    // create new inNodeStates for any new messages pumped into the graph
    // add these states to the graph's inNodeState
    const pumpedInNodeStates = useMemo(() => {
        if (!pumpedMessages || pumpedMessages.length === 0) return undefined;
        nodeStateDispatcher({type:"ADD_MESSAGES", messages: pumpedMessages, frame: clock.getElapsedTime()} );
    }, [pumpedMessages,clock]);
    // useEffect(() => {
    //     if (!pumpedInNodeStates || pumpedInNodeStates.length === 0) return;
    //     setInNodeState((state) => [...state, ...pumpedInNodeStates]);
    // }, [pumpedInNodeStates]);

    // get the incremental set of expired messages off the edge. This is a periodic check
    // Expired inEdgeStates migrate to the target node automatically
    const expiredInEdgeStates = useExpiredMessages(inEdgeState, edgeDuration);
    useEffect(() => {
        if (!expiredInEdgeStates || expiredInEdgeStates.length === 0) return;
        const newInNodeStates = expiredInEdgeStates.map((edgeState) => createInNodeState(edgeState, clock));
        setInNodeState((inNodeStates) => [...inNodeStates, ...newInNodeStates]);
    }, [expiredInEdgeStates, clock]);
    // the inverse is also simple - remove inEdgeStates that have expired
    const unexpiredInEdgeStates = useUnexpiredMessages(inEdgeState, edgeDuration);
    useEffect(() => {
        if (!unexpiredInEdgeStates || unexpiredInEdgeStates.length === 0) return;
        setInEdgeState(unexpiredInEdgeStates);
    }, [unexpiredInEdgeStates]);

    const newInEdgeStates = useReadyToEgress(inNodeState, edgesPerNode, () => true);

    // process expired messages in edge state. Update the state to add new messages for the next step
    useEffect(() => {
        if (!newInEdgeStates || newInEdgeStates.length === 0) return;
        // collect all new state at once
        // expired messages with no edge are in a node. This will have to change
        // edge expired messages just go to the node

        setInEdgeState(newInEdgeStates);
    }, [edgesPerNode, newInEdgeStates]);

    // process expired messages in node state. Update the state to add new messages for the next step
    useEffect(() => {
        if (!expiredInEdgeStates || expiredInEdgeStates.length === 0) return;
        // collect all new state at once
        const newState: InNodeState[] = [];
        for (const message of expiredInEdgeStates) {
            // expired messages with no edge are in a node. This will have to change
            newState.push({
                ...message,
                partition: 0,
                node: message.to,
            });
        }
        if (newState.length > 0) setInNodeState((state) => [...state, ...newState]);
    }, [edgesPerNode, expiredInEdgeStates]);

    // unexpired is the state we keep
    const unexpired = useUnexpiredMessages(inEdgeState, 1);
    // if it's changed then update the state
    useEffect(() => {
        if (!!unexpired) setInEdgeState(unexpired);
    }, [unexpired]);
    const messagesPerEdge = useMemo(
        () =>
            groupBy(
                inEdgeState.filter((m) => m.edge),
                (m) => m.edge
            ),
        [inEdgeState]
    );
    const edges = useMemo(() => Object.keys(messagesPerEdge), [messagesPerEdge]);
    return (
        <>
            {edges.map((me) => (
                <EdgeMessages
                    edgePoints={me}
                    duration={1}
                    messages={messagesPerEdge[me].map((p) => ({ ...p.message, index: p.index, frame: p.frame }))}
                />
            ))}
        </>
    );
};
