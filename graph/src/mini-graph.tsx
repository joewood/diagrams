import { motion } from "framer-motion";
import { keyBy } from "lodash";
import * as React from "react";
import { FC, memo, useCallback, useEffect, useMemo, useState } from "react";
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
import { TextBox } from "./svg-react";
import { useContainingRect, useSimpleGraph } from "./use-ngraph";

interface MiniGraphProps {
    nodes: SimpleNode[];
    edges: SimpleEdge[];
    targetArea: Size;
    targetOffset?: Point;
    onSelectNode?: (args: { name: string }) => void;
    selectedNode?: string | null;
    name: string;
    onNodesPositioned?: (edges: PositionedEdge[], nodes: Record<string, PositionedNode>) => void;
    renderNode?: (
        node: PositionedNode,
        onSelectNode: MiniGraphProps["onSelectNode"],
        options: Pick<RequiredGraphOptions, "defaultSize" | "textSize" | "iterations">
    ) => JSX.Element;
    options: Pick<RequiredGraphOptions, "defaultSize" | "textSize" | "iterations">;
}

export const PaintNode: FC<{
    node: PositionedNode;
    onSelectNode: MiniGraphProps["onSelectNode"];
    options: MiniGraphProps["options"];
}> = ({ node, onSelectNode, options: { textSize } }) => (
    <TextBox
        key={node.name}
        initialPosition={node.initialPosition ?? node.position}
        initialSize={node.initialSize ?? node.size}
        position={node.position}
        size={node.size}
        name={node.name}
        text={node.name}
        fillColor={node.backgroundColor ?? "gray"}
        borderColor={node.border ?? "black"}
        verticalAnchor="start"
        onSelectNode={onSelectNode}
        textSize={textSize}
        textColor="#202020"
        filter={node.shadow ? "url(#shadow)" : undefined}
    />
);

export function useChanged<T>(name: string, x: T) {
    useEffect(() => console.log(`${name} changed.`), [x, name]);
}

export function useEdges() {
    const [posEdges, setEdges] = useState<PositionedEdge[]>([]);
    const [posNodes, setNodes] = useState<Record<string, PositionedNode>>({});
    const onNodesMoved = useCallback((edges: PositionedEdge[], nodes: Record<string, PositionedNode>) => {
        setEdges(edges);
        setNodes((nd) => {
            const x = { ...nd, ...nodes };
            console.log("Nodes", x);
            return x;
        });
    }, []);
    return [posNodes, posEdges, onNodesMoved] as [
        Record<string, PositionedNode>,
        PositionedEdge[],
        MiniGraphProps["onNodesPositioned"]
    ];
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
        useChanged("edges", edges);
        useChanged("onSelectNode", nodes);
        useChanged("targetOffset", targetOffset);
        useChanged("renderNode", renderNode);
        useChanged("name", name);
        useChanged("targetArea", targetArea);
        useChanged("onNodesPositioned", onNodesPositioned);
        useChanged("options", options);

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