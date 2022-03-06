import { mix } from "chroma-js";
import * as React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import {
    Point,
    RequiredGraphOptions,
    ResizeNeededAction,
    ScreenRect,
    SimpleEdge,
    SimpleNode,
    Size
} from "../hooks/model";
import { useSimpleGraph } from "../hooks/use-ngraph";
import { useScreenNodesVectorMethod } from "../hooks/use-screen-vector";
import { Node, NodeProps } from "./node";

export interface MiniGraphProps {
    simpleNodes: SimpleNode[];
    simpleEdges: SimpleEdge[];
    screenSize: Size;
    screenPosition: Point;
    onSelectNode?: (args: { name: string }) => void;
    onExpandToggleNode?: (args: { name: string; expand: boolean }) => void;
    expanded: string[];
    selectedNode?: string | null;
    name: string;
    level: number;
    onResizeNeeded: (name: string, action: ResizeNeededAction) => void;
    onBubblePositions: (nodes: ScreenRect[]) => void;
    onGetSubgraph?: (name: string) => SimpleNode[];
    options: Pick<RequiredGraphOptions, "defaultSize" | "textSize" | "iterations" | "titleHeight" | "nodeMargin">;
}

/** This Component renders Simple Nodes by positioning them in a graph.
 *  It also advises the container that there are overlapping nodes and it needs to grow (or shrink if there's excessive room)
 *  Additionally it supports per Node size overrides for interactivity, such as rendering subgraphs
 */
export const MiniGraph = memo<MiniGraphProps>(
    ({
        simpleEdges,
        simpleNodes,
        onSelectNode,
        selectedNode,
        screenPosition,
        onResizeNeeded,
        onGetSubgraph,
        name,
        level,
        screenSize,
        onExpandToggleNode,
        expanded,
        onBubblePositions,
        options,
    }) => {
        // console.log("Size " + JSON.stringify(screenSize));
        const [localSizeOverrides, setLocalSizeOverrides] = useState<Record<string, Size>>({});
        // get the virtual positions of the nodes in a graph. This is unbounded.
        const [positionedNodes] = useSimpleGraph(simpleNodes, simpleEdges, localSizeOverrides, options);
        // Resize Demand - change the state

        const containerPadding = options.textSize;
        // adjust the position of the nodes to fit within the targetArea
        // get the containing rectangle of the graph and project it onto screen size and pos
        const [screenNodes, newSize] = useScreenNodesVectorMethod(
            screenPosition,
            screenSize,
            positionedNodes,
            localSizeOverrides,
            containerPadding * 1.1,
            options.titleHeight
        );

        // use the screenNodes as the initial positions managing the state of the nodes
        // this is updated using the onNodesPositioned
        const onResizeSetLocalSize = useCallback<NodeProps["onResizeNode"]>((name, size) => {
            setLocalSizeOverrides((oldSizes) => {
                if (!size) {
                    const newSizes = { ...oldSizes };
                    delete newSizes[name];
                    return newSizes;
                } else if (
                    !oldSizes[name] ||
                    oldSizes[name]?.width !== size.width ||
                    oldSizes[name]?.height !== size.height
                ) {
                    console.log(`Setting Local Size for: ${name} ${JSON.stringify(size)}`);
                    return { ...oldSizes, [name]: size };
                }
                return oldSizes;
            });
        }, []);
        useEffect(() => onBubblePositions?.(screenNodes), [onBubblePositions, screenNodes]);
        // useOverlapCheck(name, onResizeNeeded, options, screenNodes, screenPosition, screenSize);
        function diffRange(n1: number, n2: number) {
            return Math.abs((n1 - n2) / n1) > 0.04;
        }
        if (diffRange(screenSize.width, newSize.width) || diffRange(screenSize.height, newSize.height)) {
            onResizeNeeded(name, {
                suggestedSize: {
                    width: diffRange(screenSize.width, newSize.width) ? newSize.width : screenSize.width,
                    height: diffRange(screenSize.height, newSize.height) ? newSize.height : screenSize.height,
                },
            });
        }
        // notify parent graph that a node has been changed
        return (
            <>
                {screenNodes.map((node) => (
                    <Node
                        key={node.name}
                        screenNode={node}
                        showExpandButton={(onGetSubgraph?.(node.name)?.length ?? 0) > 0}
                        subNodes={onGetSubgraph?.(node.name)}
                        onExpandToggleNode={onExpandToggleNode}
                        isExpanded={expanded.includes(node.name)}
                        expanded={expanded}
                        level={level + 1}
                        backgroundColor={mix(node.backgroundColor ?? "gray", "rgba(255,255,255,0)", 0.4).css()}
                        borderColor={mix(
                            node.backgroundColor ?? "gray",
                            "rgba(0,0,0,0.5)",
                            expanded.includes(node.name) ? 0.6 : 0.3
                        ).css()}
                        onSelectNode={onSelectNode}
                        onGetSubgraph={onGetSubgraph}
                        onBubblePositions={onBubblePositions}
                        onResizeNode={onResizeSetLocalSize}
                        selectedNode={selectedNode}
                        options={options}
                    />
                ))}
            </>
        );
    }
);
