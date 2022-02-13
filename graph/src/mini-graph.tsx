import { motion } from "framer-motion";
import * as React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import {
    getOverlap,
    Point,
    PositionedEdge,
    RequiredGraphOptions,
    ScreenPositionedNode,
    SimpleEdge,
    SimpleNode,
    Size,
    transition,
    zeroPoint,
} from "./model";
import { Node } from "./node";
import {
    PosSize,
    useChanged,
    useContainingRect,
    useScreenNodes,
    useScreenPositionTracker,
    useSimpleGraph,
} from "./use-ngraph";

export interface MiniGraphProps {
    simpleNodes: SimpleNode[];
    simpleEdges: SimpleEdge[];
    screenSize: Size;
    screenPosition: Point;
    onSelectNode?: (args: { name: string }) => void;
    onExpandToggleNode?: (args: { name: string; expand: boolean }) => void;
    selectedNode?: string | null;
    name: string;
    onResizeNeeded?: (name: string, overlapping: boolean, shrinking: boolean) => void;
    onNodesPositioned: (nodes: PosSize[]) => void;
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
        screenSize,
        onExpandToggleNode,
        onNodesPositioned: parentOnNodesPositioned,
        options,
    }) => {
        useChanged("SN edges", simpleEdges);
        useChanged("SN nodes", simpleNodes);
        useChanged("SN targetOffset", screenPosition);
        useChanged("SN name", name);
        useChanged("SN targetArea", screenSize);
        useChanged("SN options", options);

        // get the virtual positions of the nodes in a graph. This is unbounded.
        const [positionedNodes] = useSimpleGraph(simpleNodes, simpleEdges, options);
        // Resize Demand - change the state

        const padding = options.textSize;
        // get the containing rectangle of the graph and project it onto screen size and pos
        const [virtualTopLeft, virtualSize] = useContainingRect(screenSize, positionedNodes, padding);
        // adjust the position of the nodes to fit within the targetArea
        const [screenNodes] = useScreenNodes(
            positionedNodes,
            virtualTopLeft,
            virtualSize,
            screenSize,
            screenPosition,
            padding
        );
        // use the screenNodes as the initial positions managing the state of the nodes
        // this is updated using the onNodesPositioned
        const [localPosSizes, posSizes, onNodesPositioned] = useScreenPositionTracker(screenNodes, name);
        useEffect(() => {
            console.log("DATA In MINI Graph " + JSON.stringify(localPosSizes["Data"]?.size));
        }, [localPosSizes]);
        // notify parent graph that a node has been changed
        useEffect(() => parentOnNodesPositioned?.(Object.values(posSizes)), [parentOnNodesPositioned, posSizes]);
        useEffect(() => {
            const [overlapping, paddedOverlapping] = getOverlap(Object.values(localPosSizes));
            if (overlapping || !paddedOverlapping) {
                console.log(`RESIZING for ${name} ${overlapping},${paddedOverlapping}`, JSON.stringify(localPosSizes));
                const t = setTimeout(() => onResizeNeeded?.(name, overlapping, !paddedOverlapping), 2);
                return () => clearTimeout(t);
            }
        }, [name, onResizeNeeded, localPosSizes]);
        return (
            <>
                {screenNodes.map((node) => (
                    <Node
                        key={node.name}
                        screenNode={node}
                        showExpandButton={!!onExpandToggleNode}
                        subNodes={onGetSubgraph?.(node.name)}
                        onExpandToggleNode={onExpandToggleNode}
                        expanded={node.expanded}
                        onSelectNode={onSelectNode}
                        onGetSubgraph={onGetSubgraph}
                        onNodesPositioned={onNodesPositioned}
                        selectedNode={selectedNode}
                        options={options}
                    />
                ))}
            </>
        );
    }
);
