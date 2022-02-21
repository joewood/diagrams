import { motion } from "framer-motion";
import * as React from "react";
import { FC, MouseEventHandler, useCallback, useMemo } from "react";
import { SimpleNode } from "..";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { PositionedEdge, ScreenPositionedNode, Size, transition } from "../hooks/model";
import { TextBox } from "./text-box";
import { useGraphResize } from "../hooks/use-ngraph";

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
        | "level"
    > {
    screenNode: ScreenPositionedNode;
    subNodes?: SimpleNode[];
    backgroundColor: string;
    borderColor: string;
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
    backgroundColor,
    borderColor,
    level,
    expanded,
    isExpanded,
    options,
}) => {
    const onClick = useCallback<MouseEventHandler<SVGTextElement>>(
        () => onExpandToggleNode?.({ name: screenNode.name, expand: !isExpanded }),
        [isExpanded, screenNode.name, onExpandToggleNode]
    );
    // request for expansion or shrink handled here, size is updated
    const onResizeNeeded = useGraphResize(screenNode.name, screenNode.size, onResizeNode);
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
                fillColor={backgroundColor}
                borderColor={borderColor}
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
                    level={level}
                    screenSize={screenNode.size}
                    onBubblePositions={onBubblePositions}
                    screenPosition={screenTopLeft}
                    options={options}
                />
            )}
        </>
    );
};
