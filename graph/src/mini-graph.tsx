import { motion } from "framer-motion";
import { keyBy } from "lodash";
import * as React from "react";
import { memo, useEffect, useMemo } from "react";
import {
    adjustPosition,
    Point,
    PositionedEdge,
    PositionedNode,
    RequiredGraphOptions,
    SimpleEdge,
    SimpleNode,
    Size,
    transition,
    zeroPoint
} from "./model";
import { PaintNode } from "./node";
import { AbsolutePositionedNode, useContainingRect, useSimpleGraph } from "./use-ngraph";

export interface MiniGraphProps {
    nodes: SimpleNode[];
    edges: SimpleEdge[];
    targetArea: Size;
    targetOffset?: Point;
    onSelectNode?: (args: { name: string }) => void;
    selectedNode?: string | null;
    name: string;
    onNodesPositioned: (edges: PositionedEdge[], nodes: Record<string, AbsolutePositionedNode>) => void;
    renderNode?: (
        node: PositionedNode,
        onSelectNode: MiniGraphProps["onSelectNode"],
        options: Pick<RequiredGraphOptions, "defaultSize" | "textSize" | "iterations">
    ) => JSX.Element;
    options: Pick<RequiredGraphOptions, "defaultSize" | "textSize" | "iterations">;
}

export const MiniGraph = memo<MiniGraphProps>(
    ({
        edges,
        nodes,
        onSelectNode,
        targetOffset = zeroPoint,
        renderNode,
        name,
        targetArea,
        onNodesPositioned,
        options,
    }) => {
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
        const layoutNodes = useMemo(
            () =>
                positionedNodes.map((node) => ({
                    ...node,
                    position: adjustPosition(node.position, virtualTopLeft, virtualSize, targetArea),
                    absolutePosition: adjustPosition(node.position, virtualTopLeft, virtualSize, targetArea,targetOffset),
                    containerPosition: virtualTopLeft,
                })),
            [positionedNodes, virtualTopLeft, virtualSize, targetArea, targetOffset]
        );
        useEffect(
            () =>
                onNodesPositioned?.(
                    positionedEdges,
                    keyBy(layoutNodes, (n) => n.name)
                ),
            [layoutNodes, onNodesPositioned, positionedEdges]
        );
        const customRenderNodes = (
            (renderNode && layoutNodes.map((node) => renderNode(node, onSelectNode, options))) ||
            []
        ).filter(Boolean);

        return (
            <motion.g
                layoutId={name}
                initial={{ x: targetOffset.x, y: targetOffset.y }}
                animate={{ x: targetOffset.x, y: targetOffset.y }}
                transition={transition}
            >
                {layoutNodes.map((node) => (
                    <PaintNode key={node.name} node={node} onSelectNode={onSelectNode} options={options} />
                ))}
                {customRenderNodes}
            </motion.g>
        );
    }
);
