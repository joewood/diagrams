import { mix } from "chroma-js";
import * as React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { getOverlap, Point, RequiredGraphOptions, SimpleEdge, SimpleNode, Size } from "./model";
import { Node, NodeProps } from "./node";
import { PosSize, useContainingRect, useScreenNodes, useSimpleGraph } from "./use-ngraph";

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
    onResizeNeeded: (name: string, overlapping: boolean, shrinking: boolean) => void;
    onBubblePositions: (nodes: PosSize[]) => void;
    onGetSubgraph?: (name: string) => SimpleNode[];
    options: Pick<RequiredGraphOptions, "defaultSize" | "textSize" | "iterations">;
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
        // useChanged("SN edges", simpleEdges);
        // useChanged("SN nodes", simpleNodes);
        // useChanged("SN targetOffset", screenPosition);
        // useChanged("SN name", name);
        // useChanged("SN targetArea", screenSize);
        // useChanged("SN options", options);

        const [localSizeOverrides, setLocalSizeOverrides] = useState<Record<string, Size>>({});
        // get the virtual positions of the nodes in a graph. This is unbounded.
        const [positionedNodes] = useSimpleGraph(simpleNodes, simpleEdges, localSizeOverrides, options);
        // Resize Demand - change the state

        const padding = options.textSize;
        // adjust the position of the nodes to fit within the targetArea
        // get the containing rectangle of the graph and project it onto screen size and pos
        const [virtualTopLeft, virtualSize] = useContainingRect(
            screenSize,
            positionedNodes,
            localSizeOverrides,
            padding
        );
        // const [posSizes, onNodesPositioned] = useScreenPositionTracker(name);
        const [screenNodes] = useScreenNodes(
            positionedNodes,
            virtualTopLeft,
            virtualSize,
            screenSize,
            screenPosition,
            localSizeOverrides,
            padding
        );
        // use the screenNodes as the initial positions managing the state of the nodes
        // this is updated using the onNodesPositioned

        const onResizeNode = useCallback<NodeProps["onResizeNode"]>((name, size) => {
            setLocalSizeOverrides((oldSize) => {
                if (!size) {
                    const newSize = { ...oldSize };
                    delete newSize[name];
                    return newSize;
                } else if (
                    !oldSize[name] ||
                    oldSize[name]!.width !== size.width ||
                    oldSize[name]!.height !== size.height
                ) {
                    return { ...oldSize, [name]: size };
                }
                return oldSize;
            });
        }, []);
        useEffect(() => {
            onBubblePositions?.(screenNodes);
        }, [onBubblePositions, screenNodes]);
        // notify parent graph that a node has been changed
        useEffect(() => {
            const [overlapping, paddedOverlapping] = getOverlap(screenNodes, screenPosition, screenSize);
            if (overlapping || !paddedOverlapping) {
                const t = setTimeout(() => onResizeNeeded?.(name, overlapping, !paddedOverlapping), 2);
                return () => clearTimeout(t);
            }
        }, [name, onResizeNeeded, screenNodes, screenPosition, screenSize]);
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
                        backgroundColor={mix(node.backgroundColor ?? "gray", "rgba(255,255,255,0)", 0.3).css()}
                        borderColor={mix(
                            node.backgroundColor ?? "gray",
                            "rgba(0,0,0,0)",
                            expanded.includes(node.name) ? 0.6 : 0.3
                        ).css()}
                        onSelectNode={onSelectNode}
                        onGetSubgraph={onGetSubgraph}
                        onBubblePositions={onBubblePositions}
                        onResizeNode={onResizeNode}
                        selectedNode={selectedNode}
                        options={options}
                    />
                ))}
            </>
        );
    }
);
