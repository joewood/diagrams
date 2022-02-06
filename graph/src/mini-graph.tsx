import { motion } from "framer-motion";
import { keyBy } from "lodash";
import * as React from "react";
import { memo, useEffect, useMemo } from "react";
import {
    adjustPosition,
    Point,
    PositionedEdge,
    PositionedHierarchicalNode,
    PositionedNode,
    RequiredGraphOptions,
    SimpleEdge,
    SimpleNode,
    Size,
    transition,
    zeroPoint,
} from "./model";
import { Node } from "./node";
import { AbsolutePositionedNode, useContainingRect, useSimpleGraph } from "./use-ngraph";

export interface MiniGraphProps {
    nodes: SimpleNode[];
    edges: SimpleEdge[];
    targetArea: Size;
    targetOffset?: Point;
    onSelectNode?: (args: { name: string }) => void;
    onExpandToggleNode?: (args: { name: string; expand: boolean }) => void;
    selectedNode?: string | null;
    name: string;
    onNodesPositioned: (edges: PositionedEdge[], nodes: Record<string, AbsolutePositionedNode>) => void;
    renderNode?: (
        node: PositionedNode | PositionedHierarchicalNode,
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
    targetOffset = zeroPoint,
    renderNode,
    name,
    targetArea,
    onExpandToggleNode,
    onNodesPositioned,
    options,
}: MiniGraphProps) {
    // useChanged("edges", edges);
    // useChanged("onSelectNode", nodes);
    // useChanged("targetOffset", targetOffset);
    // useChanged("renderNode", renderNode);
    // useChanged("name", name);
    // useChanged("targetArea", targetArea);
    // useChanged("onNodesPositioned", onNodesPositioned);
    // useChanged("options", options);

    // get the virtual positions of the nodes in a graph
    const [positionedNodes, positionedEdges] = useSimpleGraph(nodes, edges, options);

    // get the containing rectangle
    const [virtualTopLeft, virtualSize] = useContainingRect(targetArea, positionedNodes, options.textSize);
    // adjust the position of the nodes to fit within the targetArea
    const adjustedNodes = useMemo(
        () =>
            positionedNodes.map((node) => ({
                ...node,
                position: adjustPosition(node.position, virtualTopLeft, virtualSize, targetArea),
                absolutePosition: adjustPosition(node.position, virtualTopLeft, virtualSize, targetArea, targetOffset),
                containerPosition: virtualTopLeft,
            })),
        [positionedNodes, virtualTopLeft, virtualSize, targetArea, targetOffset]
    );
    // notify parent graph that a node has been changed
    useEffect(
        () =>
            onNodesPositioned?.(
                positionedEdges,
                keyBy(adjustedNodes, (n) => n.name)
            ),
        [adjustedNodes, onNodesPositioned, positionedEdges]
    );
    return (
        <motion.g
            layoutId={name}
            initial={{ x: targetOffset.x, y: targetOffset.y }}
            animate={{ x: targetOffset.x, y: targetOffset.y }}
            transition={transition}
        >
            {adjustedNodes.map((node) => (
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
            {((renderNode && adjustedNodes.map((node) => renderNode(node, onSelectNode, options))) || []).filter(
                Boolean
            )}
        </motion.g>
    );
}

export const MiniGraph = memo(_MiniGraph);
