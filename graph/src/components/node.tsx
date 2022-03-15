import { useColorModeValue } from "@chakra-ui/react";
import { mix } from "chroma-js";
import { motion } from "framer-motion";
import { keyBy } from "lodash";
import * as React from "react";
import { FC, useCallback, useMemo, useState } from "react";
import { SimpleNode } from "..";
import { ScreenPositionedNode, Size, transition } from "../hooks/model";
import { useGraphResize } from "../hooks/use-ngraph";
import { ExpandButton } from "../resources/expand-button";
import { FlowButton } from "../resources/flow-button";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { TextBox } from "./text-box";

export interface NodeProps
    extends Pick<
        MiniGraphProps,
        | "allRoutedSimpleEdges"
        | "selectedNodes"
        | "expanded"
        | "options"
        | "edgeInNodes"
        | "edgeOutNodes"
        | "onEdgeInNode"
        | "onEdgeOutNode"
        | "onSelectNode"
        | "onExpandToggleNode"
        | "onBubblePositions"
        | "onGetSubgraph"
    > {
    screenNode: ScreenPositionedNode;
    subNodes?: SimpleNode[];
    onResizeNode: (name: string, sizeOverride: Size | null) => void;
    showExpandButton?: boolean;
    isExpanded?: boolean;
}

/** Node either paints as a Node or a sub-graph.
 * When the Subgraph needs to grow the size is held here as state and notified to the parent
 * Graph using onNodesPositioned.
 */
export const Node: FC<NodeProps> = ({
    screenNode,
    subNodes,
    allRoutedSimpleEdges,
    expanded,
    isExpanded,
    onEdgeInNode,
    onEdgeOutNode,
    edgeInNodes,
    edgeOutNodes,
    selectedNodes,
    options,
    onSelectNode,
    onBubblePositions,
    onExpandToggleNode,
    onResizeNode,
    onGetSubgraph,
}) => {
    const onExpandCollapse = useCallback(
        () => onExpandToggleNode?.({ name: screenNode.name, expand: !isExpanded }),
        [isExpanded, screenNode.name, onExpandToggleNode]
    );
    const [hover, setHover] = useState(false);
    const onEnter = useCallback(() => setHover(true), []);
    const onLeave = useCallback(() => setHover(false), []);
    const isSelected = selectedNodes?.includes(screenNode.name) ?? false;

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
            width: screenNode.size.width - 2,
            height: isExpandedSubgraph ? options.titleHeight * 0.8 : screenNode.size.height - 2,
        }),
        [isExpandedSubgraph, options.titleHeight, screenNode.size]
    );
    const labelPosition = useMemo(
        () => ({
            x: screenNode.screenPosition.x,
            y: isExpandedSubgraph
                ? screenNode.screenPosition.y - screenNode.size.height / 2 + labelSize.height / 2 + 1
                : screenNode.screenPosition.y,
        }),
        [isExpandedSubgraph, labelSize.height, screenNode.screenPosition, screenNode.size.height]
    );
    const localSimpleEdges = useMemo(() => {
        if (!subNodes) return [];
        const subNodesDict = keyBy(subNodes, (s) => s.name);
        return allRoutedSimpleEdges.filter((e) => subNodesDict[e.from] && subNodesDict[e.to]);
    }, [allRoutedSimpleEdges, subNodes]);
    const shadow = useColorModeValue("url(#shadow)", "url(#glow)");
    const buttonColor = useColorModeValue("#333", "#eee");
    const subdue = useColorModeValue("white", "black");
    const intensify = useColorModeValue("black", "white");
    const buttonColorBorder = mix(buttonColor, subdue, 0.5).css();
    const borderColor = mix(screenNode.color, intensify, 0.4).css();
    const backgroundColor = mix(screenNode.color, subdue, 0.8).css();
    const labelColor = mix(screenNode.color, intensify, 0.995).css();
    const textBackground = isExpandedSubgraph ? mix(backgroundColor, intensify, 0.1).css() : backgroundColor;
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
                    rx: options.textSize * (isExpanded ? 1.5 : 1),
                    ry: options.textSize * (isExpanded ? 1.5 : 1),
                }}
                animate={{
                    x: screenNode.screenPosition.x - screenNode.size.width / 2,
                    y: screenNode.screenPosition.y - screenNode.size.height / 2,
                    width: screenNode.size.width,
                    height: screenNode.size.height,
                    rx: options.textSize * (isExpanded ? 1.5 : 1),
                    ry: options.textSize * (isExpanded ? 1.5 : 1),
                }}
                stroke={borderColor}
                transition={transition}
                strokeWidth={2}
                fill={backgroundColor}
                filter={screenNode.parent === null ? shadow : undefined}
                style={{ pointerEvents: "all" }}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
            />
            <TextBox
                key={screenNode.name}
                initialCenterPos={screenNode.initialScreenPosition ?? labelPosition}
                initialSize={screenNode.initialSize ?? labelSize}
                centerPos={labelPosition}
                size={labelSize}
                name={screenNode.name}
                text={screenNode.name}
                fillColor={textBackground}
                verticalAnchor="middle"
                textAnchor="middle"
                borderThickness={0}
                selected={isSelected}
                radiusTopLeft={options.textSize * (isExpanded ? 1.5 : 1)}
                radiusTopRight={options.textSize * (isExpanded ? 1.5 : 1)}
                radiusBottomLeft={isExpanded ? 0 : options.textSize}
                radiusBottomRight={isExpanded ? 0 : options.textSize}
                onSelectNode={onSelectNode}
                textSize={options.textSize}
                textColor={labelColor}
            ></TextBox>
            <motion.g
                pointerEvents="visiblePainted"
                initial={{
                    x:
                        (screenNode.initialScreenPosition ?? labelPosition).x +
                        (screenNode.initialSize ?? labelSize).width / 2 -
                        options.textSize * 0.6 -
                        options.titleHeight * 0.5,
                    y: -0.15 * options.titleHeight + (screenNode.initialScreenPosition ?? labelPosition).y,
                }}
                animate={{
                    x: labelPosition.x + labelSize.width / 2 - options.textSize * 0.6 - options.titleHeight * 0.5,
                    y: -0.15 * options.titleHeight + labelPosition.y,
                    opacity: hover ? 1 : 0,
                }}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
            >
                {isSubgraph && isExpanded && (
                    <FlowButton
                        pos={{ x: -1 * options.titleHeight * 0.5 * 1, y: 0 }}
                        borderColor={buttonColorBorder}
                        arrowColor={buttonColor}
                        width={options.titleHeight * 0.4}
                        height={options.titleHeight * 0.4}
                        nodeNames={subNodes.map(p=>p.name)}
                        onClick={onEdgeOutNode}
                        enabled={!isExpanded}
                        flowIn={false}
                    />
                )}
                {isSubgraph && isExpanded && (
                    <FlowButton
                        pos={{ x: -1 * options.titleHeight * 0.5 * 2, y: 0 }}
                        borderColor={buttonColorBorder}
                        arrowColor={buttonColor}
                        width={options.titleHeight * 0.4}
                        height={options.titleHeight * 0.4}
                        onClick={onEdgeInNode}
                        nodeNames={subNodes.map(p=>p.name)}
                        enabled={!isExpanded}
                        flowIn={true}
                    />
                )}
                {isSubgraph && (
                    <ExpandButton
                        borderColor={buttonColorBorder}
                        arrowColor={buttonColor}
                        width={options.titleHeight * 0.4}
                        height={options.titleHeight * 0.4}
                        onClick={onExpandCollapse}
                        expanded={!isExpanded}
                    />
                )}
            </motion.g>

            {isExpandedSubgraph && (
                <MiniGraph
                    key={screenNode.name + "-graph"}
                    simpleNodes={subNodes}
                    localSimpleEdges={localSimpleEdges}
                    allRoutedSimpleEdges={allRoutedSimpleEdges}
                    name={screenNode.name}
                    edgeInNodes={edgeInNodes}
                    edgeOutNodes={edgeOutNodes}
                    onEdgeInNode={onEdgeInNode}
                    onEdgeOutNode={onEdgeOutNode}
                    onSelectNode={onSelectNode}
                    selectedNodes={selectedNodes}
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
