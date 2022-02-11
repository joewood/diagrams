import { motion } from "framer-motion";
import * as React from "react";
import { memo, useEffect } from "react";
import {
    getOverlap,
    Point,
    PositionedEdge,
    RequiredGraphOptions,
    ScreenPositionedNode,
    SimpleEdge,
    SimpleNode,
    Size,
    transition,
    zeroPoint,
} from "./model";
import { Node } from "./node";
import { useChanged, useContainingRect, useScreenNodes, useSimpleGraph } from "./use-ngraph";

export interface MiniGraphProps {
    nodes: SimpleNode[];
    edges: SimpleEdge[];
    screenSize: Size;
    screenPosition?: Point;
    onSelectNode?: (args: { name: string }) => void;
    onExpandToggleNode?: (args: { name: string; expand: boolean }) => void;
    selectedNode?: string | null;
    name: string;
    onResizeNeeded?: (name: string, overlapping: boolean, shrinking: boolean) => void;
    onNodesPositioned: (name: string, edges: PositionedEdge[], nodes: Record<string, ScreenPositionedNode>) => void;
    renderNode?: (
        node: ScreenPositionedNode,
        onSelectNode: MiniGraphProps["onSelectNode"],
        options: Pick<RequiredGraphOptions, "defaultSize" | "textSize" | "iterations">
    ) => JSX.Element;
    options: Pick<RequiredGraphOptions, "defaultSize" | "textSize" | "iterations">;
}

function _MiniGraph({
    edges,
    nodes,
    onSelectNode,
    selectedNode,
    screenPosition = zeroPoint,
    renderNode,
    onResizeNeeded,
    name,
    screenSize,
    onExpandToggleNode,
    onNodesPositioned,
    options,
}: MiniGraphProps) {
    useChanged("SN edges", edges);
    useChanged("SN nodes", nodes);
    useChanged("SN targetOffset", screenPosition);
    useChanged("SN renderNode", renderNode);
    useChanged("SN name", name);
    useChanged("SN targetArea", screenSize);
    useChanged("SN onNodesPositioned", onNodesPositioned);
    useChanged("SN options", options);

    // get the virtual positions of the nodes in a graph
    const [positionedNodes, positionedEdges] = useSimpleGraph(nodes, edges, options);
    const padding = options.textSize;
    // get the containing rectangle
    const [virtualTopLeft, virtualSize] = useContainingRect(screenSize, positionedNodes, padding);
    // adjust the position of the nodes to fit within the targetArea
    const [screenNodes, screenNodesDict] = useScreenNodes(
        positionedNodes,
        virtualTopLeft,
        virtualSize,
        screenSize,
        screenPosition ?? zeroPoint,
        padding
    );

    // notify parent graph that a node has been changed
    useEffect(
        () => onNodesPositioned?.(name, positionedEdges, screenNodesDict),
        [screenNodes, name, onNodesPositioned, positionedEdges, screenNodesDict]
    );
    useEffect(() => {
        const [overlapping, paddedOverlapping] = getOverlap(screenNodes);
        if (overlapping) console.log("Overlapping");
        if (overlapping || !paddedOverlapping) onResizeNeeded?.(name, overlapping, !paddedOverlapping);
    }, [screenNodes, name, onResizeNeeded]);
    return (
        <motion.g layoutId={name} transition={transition}>
            {screenNodes.map((node) => (
                <Node
                    key={node.name}
                    node={node}
                    showExpandButton={!!onExpandToggleNode}
                    onExpandToggleNode={onExpandToggleNode}
                    expanded={node.expanded}
                    onSelectNode={onSelectNode}
                    selectedNode={selectedNode}
                    options={options}
                />
            ))}
            {((renderNode && screenNodes.map((node) => renderNode(node, onSelectNode, options))) || []).filter(Boolean)}
        </motion.g>
    );
}

export const MiniGraph = memo(_MiniGraph);
