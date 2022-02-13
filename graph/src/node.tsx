import { mix } from "chroma-js";
import { motion } from "framer-motion";
import * as React from "react";
import { FC, MouseEventHandler, useCallback, useMemo } from "react";
import { SimpleNode } from ".";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { PositionedEdge, ScreenPositionedNode, Size, transition } from "./model";
import { TextBox } from "./svg-react";
import { useGraphResize } from "./use-ngraph";

export interface NodeProps
    extends Pick<
        MiniGraphProps,
        | "onSelectNode"
        | "selectedNode"
        | "onExpandToggleNode"
        | "options"
        | "expanded"
        | "onBubblePositions"
        | "onGetSubgraph"
    > {
    screenNode: ScreenPositionedNode;
    subNodes?: SimpleNode[];
    onResizeNode: (name: string, sizeOverride: Size | null) => void;
    showExpandButton?: boolean;
    isExpanded?: boolean;
}
const emptyArray: PositionedEdge[] = [];

/** Node either paints as a Node or a sub-graph.
 * When the Subgraph needs to grow the size is held here as state and notified to the parent
 * Graph using onNodesPositioned.
 */
export const Node: FC<NodeProps> = ({
    screenNode,
    subNodes,
    onSelectNode,
    selectedNode,
    onBubblePositions,
    onExpandToggleNode,
    onResizeNode,
    onGetSubgraph,
    expanded,
    isExpanded,
    options,
}) => {
    if (screenNode.name === "Network") {
        console.log("NODE NETWORK ", subNodes?.length);
    }
    if (screenNode.name === "Network") {
        console.log("NODE NETWORK ", isExpanded);
    }
    const onClick = useCallback<MouseEventHandler<SVGTextElement>>(
        () => onExpandToggleNode?.({ name: screenNode.name, expand: !isExpanded }),
        [isExpanded, screenNode.name, onExpandToggleNode]
    );
    // request for expansion or shrink handled here, size is updated
    const onResizeNeeded = useGraphResize(screenNode.name, screenNode.size, onResizeNode, isExpanded);
    const screenTopLeft = useMemo(
        () => ({
            x: screenNode.screenPosition.x - screenNode.size.width / 2,
            y: screenNode.screenPosition.y - screenNode.size.height / 2,
        }),
        [screenNode.screenPosition.x, screenNode.screenPosition.y, screenNode.size]
    );
    return (
        <>
            <TextBox
                key={screenNode.name}
                initialPosition={screenNode.initialScreenPosition ?? screenNode.screenPosition}
                initialSize={screenNode.initialSize ?? screenNode.size}
                position={screenNode.screenPosition}
                size={screenNode.size}
                name={screenNode.name}
                text={screenNode.name}
                fillColor={screenNode.backgroundColor ?? "gray"}
                borderColor={screenNode.border ?? mix(screenNode.backgroundColor ?? "gray", "black", 0.3).css()}
                borderThickness={selectedNode === screenNode.name ? 2 : 1}
                verticalAnchor="start"
                onSelectNode={onSelectNode}
                textSize={options.textSize}
                textColor="#202020"
                filter={screenNode.shadow ? "url(#shadow)" : undefined}
            >
                {onGetSubgraph && subNodes && subNodes.length > 0 && (
                    <motion.text
                        fontSize={options.textSize * 2}
                        initial={{
                            x: (screenNode.initialSize ?? screenNode.size).width - options.textSize * 2,
                            y: options.textSize * 2,
                        }}
                        transition={transition}
                        style={{ userSelect: "none" }}
                        cursor="pointer"
                        onClick={onClick}
                        animate={{
                            x: screenNode.size.width - options.textSize * 2,
                            y: options.textSize * 2,
                        }}
                    >
                        {isExpanded ? "-" : "+"}
                    </motion.text>
                )}
            </TextBox>
            {isExpanded && subNodes && subNodes.length > 0 && (
                <MiniGraph
                    key={screenNode.name + "-graph"}
                    simpleNodes={subNodes}
                    simpleEdges={emptyArray}
                    name={screenNode.name}
                    onSelectNode={onSelectNode}
                    selectedNode={selectedNode}
                    onResizeNeeded={onResizeNeeded}
                    onGetSubgraph={onGetSubgraph}
                    onExpandToggleNode={onExpandToggleNode}
                    expanded={expanded}
                    screenSize={screenNode.size}
                    onBubblePositions={onBubblePositions}
                    screenPosition={screenTopLeft}
                    options={options}
                />
            )}
        </>
    );
};
