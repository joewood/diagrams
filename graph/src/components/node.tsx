import { useColorModeValue } from "@chakra-ui/react";
import { useText } from "@visx/text";
import { mix } from "chroma-js";
import { motion } from "framer-motion";
import { every, keyBy } from "lodash";
import * as React from "react";
import { FC, useCallback, useEffect, useMemo } from "react";
import { SimpleNode } from "..";
import { getAllChildNodes } from "../hooks/dynamic-nodes";
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
        | "edgesFiltered"
        | "onFilterEdges"
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
    onFilterEdges,
    edgesFiltered,
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
        [isExpandedSubgraph, options.titleHeight, screenNode.size.height, screenNode.size.width]
    );
    const labelPosition = useMemo(
        () => ({
            x: screenNode.size.width / 2,
            y: isExpandedSubgraph ? labelSize.height / 2 + 1 : screenNode.size.height / 2,
        }),
        [isExpandedSubgraph, labelSize.height, screenNode.size.height, screenNode.size.width]
    );
    const localSimpleEdges = useMemo(() => {
        if (!subNodes) return [];
        const subNodesDict = keyBy(subNodes, (s) => s.name);
        return allRoutedSimpleEdges.filter((e) => subNodesDict[e.from] && subNodesDict[e.to]);
    }, [allRoutedSimpleEdges, subNodes]);

    const textProps = useText({
        children: screenNode.name ?? screenNode.name,
        textAnchor: "middle",
        verticalAnchor: "middle",
        x: 0,
        y: 0,
        width: screenNode.size.width - options.textSize * 4,
        height: screenNode.size.height,
        fontSize: options.textSize,
        fontWeight: "bold",
    });
    useEffect(() => {
        const estimatedSize = (textProps.wordsByLines.length + 1.5) * options.textSize;
        if (estimatedSize > Math.max(screenNode.size.height, options.defaultHeight)) {
            onResizeNeeded(screenNode.name, {
                suggestedSize: {
                    width: screenNode.size.width,
                    height: estimatedSize * 1.1,
                },
            });
        }
    }, [
        onResizeNeeded,
        options.defaultHeight,
        options.textSize,
        screenNode.name,
        screenNode.size.height,
        screenNode.size.width,
        textProps.wordsByLines.length,
    ]);

    const allChildNodes = useMemo(
        () => [screenNode.name, ...getAllChildNodes(onGetSubgraph, screenNode.name)],
        [onGetSubgraph, screenNode.name]
    );
    const isFlowIn = useMemo(() => {
        const k = keyBy(edgesFiltered ?? [], (e) => e);
        return every(allChildNodes, (s) => k[s]);
    }, [edgesFiltered, allChildNodes]);

    const shadow = useColorModeValue("url(#shadow)", "url(#glow)");
    const subdue = useColorModeValue("white", "black");
    const intensify = useColorModeValue("black", "white");
    const borderColor = mix(screenNode.color, intensify, 0.4).css();
    const backgroundColor = mix(screenNode.color, subdue, 0.8).css();
    const buttonColor = mix(backgroundColor, intensify, 0.3).css();
    const buttonColorBright = mix(buttonColor, intensify, 1).css();
    const labelColor = mix(screenNode.color, intensify, 0.995).css();
    const textBackground = isExpandedSubgraph ? mix(backgroundColor, intensify, 0.1).css() : backgroundColor;
    return (
        <>
            <motion.g
                initial={{
                    x:
                        (screenNode.initialScreenPosition ?? screenNode.screenPosition).x -
                        (screenNode.initialSize ?? screenNode.size).width / 2,
                    y:
                        (screenNode.initialScreenPosition ?? screenNode.screenPosition).y -
                        (screenNode.initialSize ?? screenNode.size).height / 2,
                }}
                animate={{
                    x: screenNode.screenPosition.x - screenNode.size.width / 2,
                    y: screenNode.screenPosition.y - screenNode.size.height / 2,
                }}
                transition={transition}
            >
                <motion.rect
                    key={screenNode.name + "-border"}
                    layoutId={screenNode.name + "-border"}
                    initial={{
                        width: (screenNode.initialSize ?? screenNode.size).width,
                        height: (screenNode.initialSize ?? screenNode.size).height,
                        rx: options.textSize * (isExpanded ? 1.5 : 1),
                        ry: options.textSize * (isExpanded ? 1.5 : 1),
                    }}
                    animate={{
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
                />
                <TextBox
                    key={screenNode.name}
                    initialCenterPos={labelPosition}
                    initialSize={screenNode.initialSize ?? labelSize}
                    centerPos={labelPosition}
                    size={labelSize}
                    textMarginWidth={options.textSize * 4}
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
                />
                {isSubgraph && (
                    <FlowButton
                        pos={{
                            x: options.textSize * (isExpanded ? 0.5 : 0.2),
                            y: labelPosition.y - options.textSize / 1.5,
                        }}
                        highlightColor={buttonColorBright}
                        inverseColor={textBackground}
                        arrowColor={buttonColor}
                        width={options.titleHeight * 0.4}
                        height={options.titleHeight * 0.4}
                        onClick={onFilterEdges}
                        nodeNames={allChildNodes}
                        enabled={isFlowIn}
                    />
                )}
                {isSubgraph && (
                    <ExpandButton
                        pos={{
                            x: screenNode.size.width - options.textSize * (isExpanded ? 1.7 : 1.4),
                            y: labelPosition.y - options.textSize / 1.5,
                        }}
                        arrowColor={buttonColor}
                        highlightColor={buttonColorBright}
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
                    edgesFiltered={edgesFiltered}
                    onFilterEdges={onFilterEdges}
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
