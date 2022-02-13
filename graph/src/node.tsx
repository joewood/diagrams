import { mix } from "chroma-js";
import { motion } from "framer-motion";
import * as React from "react";
import { FC, MouseEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { SimpleNode } from ".";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { PositionedEdge, ScreenPositionedNode, Size } from "./model";
import { TextBox } from "./svg-react";
import { useGraphResize } from "./use-ngraph";

export interface NodeProps
    extends Pick<
        MiniGraphProps,
        "onSelectNode" | "selectedNode" | "onExpandToggleNode" | "options" | "onNodesPositioned" | "onGetSubgraph"
    > {
    screenNode: ScreenPositionedNode;
    subNodes?: SimpleNode[];
    showExpandButton?: boolean;
    expanded?: boolean;
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
    onNodesPositioned: parentOnNodesPositioned,
    onExpandToggleNode,
    onGetSubgraph,
    expanded,
    options,
}) => {
    const onClick = useCallback<MouseEventHandler<SVGTextElement>>(
        () => onExpandToggleNode?.({ name: screenNode.name, expand: !expanded }),
        [expanded, screenNode.name, onExpandToggleNode]
    );
    // request for expansion or shrink handled here, size is updated
    const [sizeOverride, onResizeNeeded] = useGraphResize(undefined, screenNode.size,expanded);
    const screenTopLeft = useMemo(
        () => ({
            x: screenNode.screenPosition.x - (sizeOverride ?? screenNode.size).width / 2,
            y: screenNode.screenPosition.y - (sizeOverride ?? screenNode.size).height / 2,
        }),
        [screenNode.screenPosition.x, screenNode.screenPosition.y, screenNode.size, sizeOverride]
    );
    // if the current Node changes size or position then let the parent know
    useEffect(() => {
        if (screenNode.name === "Data") {
            console.log("DATA Size:" + JSON.stringify(sizeOverride));
        }
        parentOnNodesPositioned([
            {
                name: screenNode.name,
                screenPosition: screenNode.screenPosition,
                size: sizeOverride ?? screenNode.size,
            },
        ]);
    }, [parentOnNodesPositioned, screenNode.name, screenNode.screenPosition, screenNode.size, sizeOverride]);
    return (
        <>
            <TextBox
                key={screenNode.name}
                initialPosition={screenNode.initialScreenPosition ?? screenNode.screenPosition}
                initialSize={screenNode.initialSize ?? screenNode.size}
                position={screenNode.screenPosition}
                size={sizeOverride ?? screenNode.size}
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
                        style={{ userSelect: "none" }}
                        cursor="pointer"
                        onClick={onClick}
                        animate={{
                            x: (sizeOverride ?? screenNode.size).width - options.textSize * 2,
                            y: options.textSize * 2,
                        }}
                    >
                        {expanded ? "-" : "+"}
                    </motion.text>
                )}
            </TextBox>
            {expanded && subNodes && subNodes.length > 0 && (
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
                    screenSize={sizeOverride ?? screenNode.size}
                    onNodesPositioned={parentOnNodesPositioned}
                    screenPosition={screenTopLeft}
                    options={options}
                />
            )}
        </>
    );
};
