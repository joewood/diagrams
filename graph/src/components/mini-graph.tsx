import { keyBy } from "lodash";
import * as React from "react";
import { memo, useEffect, useMemo } from "react";
import { useNodeSize } from "../hooks/dynamic-nodes";
import { Point, RequiredGraphOptions, ScreenRect, SimpleEdge, SimpleNode, Size } from "../hooks/model";
import { usePositionedNodes } from "../hooks/use-ngraph";
import { useScreenNodesVectorMethod } from "../hooks/use-screen-vector";
import { Node } from "./node";

export interface MiniGraphProps {
    simpleNodes: SimpleNode[];
    localSimpleEdges: SimpleEdge[];
    allRoutedSimpleEdges: SimpleEdge[];
    screenSize: Size;
    screenPosition: Point;
    onSelectNode: (args: { name: string; selected: boolean }) => void;
    onExpandToggleNode?: (args: { name: string; expand: boolean }) => void;
    expanded: string[];
    edgesFiltered?: string[];
    onFilterEdges?: (args: { names: string[]; include: boolean }) => void;
    selectedNodes: string[] | null;
    name: string;
    onResizeNode: (name: string, size: Size, expanded: boolean) => void;
    onBubblePositions: (nodes: ScreenRect[]) => void;
    onGetSubgraph?: (name: string) => SimpleNode[];
    options: Pick<
        RequiredGraphOptions,
        "defaultWidth" | "defaultHeight" | "textSize" | "iterations" | "titleHeight" | "nodeMargin"
    >;
}

/** This Component renders Simple Nodes by positioning them in a graph.
 *  It also advises the container that there are overlapping nodes and it needs to grow (or shrink if there's excessive room)
 *  Additionally it supports per Node size overrides for interactivity, such as rendering subgraphs
 */
export const MiniGraph = memo<MiniGraphProps>(
    ({
        localSimpleEdges,
        allRoutedSimpleEdges,
        simpleNodes,
        onSelectNode,
        selectedNodes,
        screenPosition,
        edgesFiltered,
        onFilterEdges,
        onResizeNode: onResizeParent,
        onGetSubgraph,
        name,
        screenSize,
        onExpandToggleNode,
        expanded,
        onBubblePositions,
        options,
    }) => {
        const [getSize, onResizeChildNodes] = useNodeSize(options.defaultWidth, options.defaultHeight);
        // get the virtual positions of the nodes in a graph. This is unbounded.
        const [positionedNodes] = usePositionedNodes(simpleNodes, localSimpleEdges, getSize, expanded, options);
        // Resize Demand - change the state
        // const nodeDict = useMemo(() => keyBy(positionedNodes, (p) => p.name), [positionedNodes]);
        // adjust the position of the nodes to fit within the targetArea
        // get the containing rectangle of the graph and project it onto screen size and pos
        // use the screenNodes as the initial positions managing the state of the nodes
        // this is updated using the onNodesPositioned

        const [screenNodes, newSize] = useScreenNodesVectorMethod(
            screenPosition,
            positionedNodes,
            options.nodeMargin,
            options.titleHeight
        );

        useEffect(() => onBubblePositions?.(screenNodes), [onBubblePositions, screenNodes]);
        // useOverlapCheck(name, onResizeNeeded, options, screenNodes, screenPosition, screenSize);
        function diffRange(n1: number, n2: number) {
            return Math.abs((n1 - n2) / n1) > 0.01;
        }
        useEffect(() => {
            if (diffRange(screenSize.width, newSize.width) || diffRange(screenSize.height, newSize.height)) {
                // console.log(
                //     `Different Enough ${name} ${screenSize.width}/${newSize.width} ${screenSize.height}/${newSize.height}`
                // );
                const size = {
                    width: diffRange(screenSize.width, newSize.width) ? newSize.width : screenSize.width,
                    height: diffRange(screenSize.height, newSize.height) ? newSize.height : screenSize.height,
                };
                onResizeParent(name, size, true);
            }
        }, [name, newSize.height, newSize.width, onResizeParent, screenSize.height, screenSize.width]);
        // notify parent graph that a node has been changed
        return (
            <>
                {screenNodes.map((node) => (
                    <Node
                        key={node.name}
                        screenNode={node}
                        allRoutedSimpleEdges={allRoutedSimpleEdges}
                        showExpandButton={(onGetSubgraph?.(node.name)?.length ?? 0) > 0}
                        subNodes={onGetSubgraph?.(node.name)}
                        onExpandToggleNode={onExpandToggleNode}
                        isExpanded={expanded.includes(node.name)}
                        edgesFiltered={edgesFiltered}
                        onFilterEdges={onFilterEdges}
                        expanded={expanded}
                        onSelectNode={onSelectNode}
                        onGetSubgraph={onGetSubgraph}
                        onBubblePositions={onBubblePositions}
                        onResizeNode={onResizeChildNodes}
                        selectedNodes={selectedNodes}
                        options={options}
                    />
                ))}
            </>
        );
    }
);
