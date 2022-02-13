import { motion, Point } from "framer-motion";
import * as React from "react";
import { memo, useMemo } from "react";
import { getAnchors, RequiredGraphOptions, SimpleEdge, Size, transition } from "./model";

interface Props {
    positionDict: Record<string, { screenPosition: Point; size: Size }>;
    edges: SimpleEdge[];
    name: string;
    options: Pick<RequiredGraphOptions, "defaultSize" | "textSize" | "iterations">;
}

export const Edges = memo<Props>(({ edges, positionDict, options }) => {
    // get the containing rectangle
    // adjust the position of the nodes to fit within the targetArea
    const layoutEdges = useMemo(
        () =>
            edges
                .map((e) => {
                    const nodeFrom = positionDict[e?.from];
                    const nodeTo = positionDict[e?.to];
                    if (!nodeFrom || !nodeTo) {
                        console.log("cannot find nodes from edge", e);
                        return null;
                    }
                    const [fromPoint, midPoint1, midPoint2, toPoint] = getAnchors(
                        nodeTo.screenPosition,
                        nodeTo.size ?? options.defaultSize,
                        nodeFrom.screenPosition,
                        nodeFrom.size ?? options.defaultSize
                    );
                    return { ...e, points: [fromPoint, midPoint1, midPoint2, toPoint] };
                })
                .filter((e) => e !== null),
        [edges, options.defaultSize, positionDict]
    );

    return (
        <>
            {layoutEdges.map(
                (edge) =>
                    edge && (
                        <motion.path
                            key={edge.name}
                            layoutId={edge.name}
                            initial={{
                                d: `M ${edge.points[0].x},${edge.points[0].y} C ${edge.points[1].x},${
                                    edge!.points[1].y
                                } ${edge.points[2].x},${edge!.points[2].y} ${edge.points[3].x},${edge!.points[3].y}`,
                                opacity: 0,
                            }}
                            animate={{
                                d: `M ${edge!.points[0].x}, ${edge!.points[0].y} C ${edge!.points[1].x}, ${
                                    edge!.points[1].y
                                } ${edge.points[2].x},${edge!.points[2].y}  ${edge.points[3].x},${edge!.points[3].y}`,
                                opacity: 1,
                            }}
                            stroke={edge!.color ?? "black"}
                            strokeWidth={edge!.thickness ?? options.textSize / 10}
                            markerEnd="url(#arrowhead)"
                            transition={transition}
                            fill="transparent"
                        />
                    )
            )}
            {layoutEdges.map(
                (edge) =>
                    edge && (
                        <motion.text
                            key={edge.name + "-text"}
                            layoutId={edge.name + "-text"}
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
