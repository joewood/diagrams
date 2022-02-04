import { motion } from "framer-motion";
import { keyBy } from "lodash";
import * as React from "react";
import { memo, useMemo } from "react";
import {
    getAnchor,
    getMidPoint,
    Point,
    PositionedEdge,
    PositionedNode,
    RequiredGraphOptions,
    Size,
    transition,
} from "./model";

interface Props {
    nodes: Record<string, PositionedNode>;
    edges: PositionedEdge[];
    targetSize: Size;
    targetOffset?: Point;
    name: string;
    options: Pick<RequiredGraphOptions, "defaultSize" | "textSize" | "iterations">;
}

export const Edges = memo<Props>(({ edges, nodes, targetSize: targetArea, options }) => {
    // get the containing rectangle
    // const [virtualTopLeft, virtualSize] = useContainingRect(targetArea, nodes, options.textSize);
    // adjust the position of the nodes to fit within the targetArea
    const nodesDict = useMemo(() => keyBy(nodes, (n) => n.name), [nodes]);
    const layoutEdges = useMemo(
        () =>
            edges
                .map((e) => {
                    const ndFrom = nodesDict[e.from];
                    const ndTo = nodesDict[e.to];
                    if (!ndFrom || !ndTo) {
                        console.warn("cannot find nodes from edge", e);
                        return null;
                    }
                    const _fromPoint = (ndFrom as unknown as any).absolutePosition;
                    const _toPoint = (ndTo as unknown as any).absolutePosition;
                    // const fromPos = adjustPosition(e.fromNode.position, virtualTopLeft, virtualSize, targetArea);
                    // const toPos = adjustPosition(e.toNode.position, virtualTopLeft, virtualSize, targetArea);
                    const midPoint = {
                        x: getMidPoint(_fromPoint.x, _toPoint.x, 0.5),
                        y: getMidPoint(_fromPoint.y, _toPoint.y, 0.5),
                    };
                    const fromPoint = getAnchor(_fromPoint, nodesDict[e.from].size ?? options.defaultSize, _toPoint);
                    const toPoint = getAnchor(_toPoint, nodesDict[e.to].size ?? options.defaultSize, _fromPoint);
                    return { ...e, points: [fromPoint, midPoint, toPoint] };
                })
                .filter((e) => e !== null),

        [edges, nodesDict, options.defaultSize]
    );

    return (
        <>
            {layoutEdges.map(
                (edge) =>
                    edge && (
                        <motion.path
                            key={edge!.name}
                            layoutId={edge!.name}
                            initial={{
                                d: `M ${edge!.points[0].x},${edge!.points[0].y} L ${edge!.points[2].x},${
                                    edge!.points[2].y
                                }`,
                                opacity: 0,
                            }}
                            animate={{
                                d: `M ${edge!.points[0].x}, ${edge!.points[0].y} L ${edge!.points[2].x}, ${
                                    edge!.points[2].y
                                }`,
                                opacity: 1,
                            }}
                            stroke={edge!.color ?? "black"}
                            strokeWidth={edge!.thickness ?? options.textSize / 10}
                            markerEnd="url(#arrowhead)"
                            transition={transition}
                        />
                    )
            )}
            {layoutEdges.map(
                (edge) =>
                    edge && (
                        <motion.text
                            key={edge.name + "X"}
                            layoutId={edge.name + "X"}
                            textAnchor="middle"
                            fontSize={options.textSize}
                            fill={edge.labelColor ?? "#333"}
                            initial={{
                                x: edge.points[1].x,
                                y: edge.points[1].y,
                            }}
                            animate={{
                                x: edge.points[1].x,
                                y: edge.points[1].y,
                            }}
                            transition={transition}
                        >
                            {edge.label}
                        </motion.text>
                    )
            )}
        </>
    );
});
