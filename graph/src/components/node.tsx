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
    const onResizeNeeded = useGraphResize(screenNode.name, screenNode.size, onResizeNode, isExpanded);
    const screenTopLeft = useMemo(
        () => ({
            x: screenNode.screenPosition.x - screenNode.size.width / 2,
            y: screenNode.screenPosition.y - screenNode.size.height / 2,
        }),
        [screenNode.screenPosition.x, screenNode.screenPosition.y, screenNode.size]
    );
    const isSubgraph = onGetSubgraph && subNodes && subNodes.length > 0;
    const isExpandedSubgraph = isSubgraph && isExpanded;
    const labelSize = useMemo(
        () => ({
            ...screenNode.size,
            height: isExpandedSubgraph ? options.titleHeight * 0.9 : screenNode.size.height,
        }),
        [isExpandedSubgraph, options.titleHeight, screenNode.size]
    );
    const onMouseOverText = useCallback<MouseEventHandler<SVGTextElement>>( (args) => {
        (args.target as any).setAttribute('fill', 'blue')
    },[])
    const labelPosition = useMemo(
        () => ({
            ...screenNode.screenPosition,
            y: isExpandedSubgraph
                ? screenNode.screenPosition.y - screenNode.size.height / 2 + labelSize.height / 2
                : screenNode.screenPosition.y,
        }),
        [isExpandedSubgraph, labelSize.height, screenNode.screenPosition, screenNode.size.height]
    );
    return (
        <>
            <motion.rect
                key={screenNode.name + "-border"}
                layoutId={screenNode.name + "-border"}
                initial={{
                    x:
                        (screenNode.initialScreenPosition ?? screenNode.screenPosition).x -
                        (screenNode.initialSize ?? screenNode.size).width / 2,
                    y:
                        (screenNode.initialScreenPosition ?? screenNode.screenPosition).y -
                        (screenNode.initialSize ?? screenNode.size).height / 2,
                    width: (screenNode.initialSize ?? screenNode.size).width,
                    height: (screenNode.initialSize ?? screenNode.size).height,
                }}
                animate={{
                    x: screenNode.screenPosition.x - screenNode.size.width / 2,
                    y: screenNode.screenPosition.y - screenNode.size.height / 2,
                    width: screenNode.size.width,
                    height: screenNode.size.height,
                }}
                stroke={borderColor}
                transition={transition}
                strokeWidth={selectedNode === screenNode.name ? 2 : 1}
                fill={backgroundColor}
                filter={screenNode.shadow ? "url(#shadow)" : undefined}
            />

            <TextBox
                key={screenNode.name}
                initialCenterPos={screenNode.initialScreenPosition ?? screenNode.screenPosition}
                initialSize={screenNode.initialSize ?? labelSize}
                centerPos={labelPosition}
                size={labelSize}
                name={screenNode.name}
                text={screenNode.name}
                fillColor={isExpandedSubgraph ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0)"}
                verticalAnchor="middle"
                textAnchor="middle"
                onSelectNode={onSelectNode}
                textSize={options.textSize}
                textColor="#202020"
            >
                {isSubgraph && (
                    <motion.text
                        layoutId={screenNode.name + "-expand-button"}
                        fontSize={options.textSize * 2}
                        initial={{
                            x: (screenNode.initialSize ?? labelSize).width / 2 - options.textSize,
                            y: 0,
                        }}
                        animate={{
                            x: labelSize.width / 2 - options.textSize,
                            y: 0,
                        }}
                        textAnchor="middle"
                        transition={transition}
                        style={{ userSelect: "none" }}
                        cursor="pointer"
                        fill="black"
                        onClick={onClick}
                        onMouseMove={onMouseOverText}
                    >
                        {isExpanded ? "-" : "+"}
                    </motion.text>
                )}
            </TextBox>
            {isExpandedSubgraph && (
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
