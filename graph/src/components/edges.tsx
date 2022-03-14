import { motion, Point } from "framer-motion";
import { groupBy, sumBy } from "lodash";
import * as React from "react";
import { memo, useMemo } from "react";
import { getAnchors } from "../hooks/calc-best-anchors";
import { RequiredGraphOptions, SimpleEdge, SimpleNode, Size, transition } from "../hooks/model";
import { useColorModeValue } from "@chakra-ui/react";
import { mix } from "chroma-js";

const arrowHeight = 6;
const arrowWidth = 7;

interface Props {
    positionDict: Record<string, { screenPosition: Point; size: Size }>;
    nodesDict: Record<string, SimpleNode>;
    edges: SimpleEdge[];
    name: string;
    selected?: string[];
    options: Pick<RequiredGraphOptions, "defaultWidth" | "defaultHeight" | "textSize" | "iterations" | "nodeMargin">;
}

export const Edges = memo<Props>(({ edges, positionDict, nodesDict, selected, options }) => {
    // get the containing rectangle
    // adjust the position of the nodes to fit within the targetArea
    const textStroke = useColorModeValue("rgba(255,255,255,0.3)", "rgba(0,0,0,0.3)");
    const intensify = useColorModeValue("black", "white");
    const blend = useColorModeValue("white", "black");
    const layoutEdges = useMemo(() => {
        const groupedEdges = groupBy(edges, (e) => `${e.from}-${e.to}`) as Record<string, SimpleEdge[]>;
        const uniqueEdges = Object.values(groupedEdges).map((edgesInGroup) => ({
            ...edgesInGroup[0],
            thickness: Math.log10(sumBy(edgesInGroup, (ee) => 1.5)) + 1,
            label: edgesInGroup.length > 1 ? null : edgesInGroup[0].label,
        }));
        return uniqueEdges
            .filter((edge) => edge.from !== edge.to)
            .map((e) => {
                const nodeFrom = positionDict[e?.from];
                const nodeTo = positionDict[e?.to];
                if (!nodeFrom || !nodeTo) {
                    return null;
                }
                const anchors = getAnchors(
                    nodeTo.screenPosition,
                    nodeTo.size ?? { width: options.defaultWidth, height: options.defaultHeight },
                    nodeFrom.screenPosition,
                    nodeFrom.size ?? { width: options.defaultWidth, height: options.defaultHeight },
                    arrowHeight * e.thickness
                );
                return { ...e, points: anchors };
            })
            .filter((e) => e !== null);
    }, [edges, options.defaultHeight, options.defaultWidth, positionDict]);
    return (
        <>
            {layoutEdges.map((edge) => {
                if (!edge) return null;
                if (!selected?.includes(edge.name)) return null;
                const labelColor = mix(edge.color!, intensify, 0.8).css();
                const edgeColor = mix(nodesDict[edge.from]?.color ?? "white", blend, 0.2).css();
                const {
                    thickness,
                    points: { toArrowStem, toAnchor, fromAnchor, fromNormal, toNormal, directionX, directionY },
                } = edge;
                const arrowPoints = `
                    ${toArrowStem.x + (arrowWidth / 2) * thickness * directionY} 
                    ${toArrowStem.y + (arrowWidth / 2) * thickness * directionX},
                    ${toAnchor.x} ${toAnchor.y},
                    ${toArrowStem.x - (arrowWidth / 2) * thickness * directionY} 
                    ${toArrowStem.y - (arrowWidth / 2) * thickness * directionX}`.replaceAll("\n", " ");
                const arrowPointsInit = `
                    ${fromNormal.x + (arrowWidth / 2) * thickness * directionY} 
                    ${fromNormal.y + (arrowWidth / 2) * thickness * directionX},
                    ${fromNormal.x} ${toAnchor.y},
                    ${fromNormal.x - (arrowWidth / 2) * thickness * directionY} 
                    ${fromNormal.y - (arrowWidth / 2) * thickness * directionX}`.replaceAll("\n", " ");

                const curvePoints = `M ${fromAnchor.x}, ${fromAnchor.y} 
                                     C ${fromNormal.x}, ${fromNormal.y} 
                                       ${toNormal.x}, ${toNormal.y}  
                                       ${toArrowStem.x}, ${toArrowStem.y}`.replaceAll("\n\t", " ");
                const curvePointsInit = `M ${fromAnchor.x}, ${fromAnchor.y} 
                                       C ${fromNormal.x}, ${fromNormal.y} 
                                         ${fromNormal.x}, ${fromNormal.y}  
                                         ${fromNormal.x}, ${fromNormal.y}`.replaceAll("\n\t", " ");
                // console.log(`startX (${arrowPoints})`, directionX, directionY, toArrowStem.y, toAnchor.y);
                return (
                    <>
                        {/* We're doing this manually because Chrome doesn't support colored line markers */}
                        <motion.polygon
                            key={edge.name + "-end"}
                            layoutId={edge.name + "-end"}
                            style={{
                                pointerEvents: "none",
                            }}
                            initial={{
                                points: arrowPointsInit,
                                opacity: 0,
                            }}
                            animate={{
                                points: arrowPoints,
                                opacity: 1,
                            }}
                            stroke={edgeColor}
                            fill={edgeColor}
                            strokeWidth={0}
                            transition={transition}
                        />
                        <motion.path
                            key={edge.name + "-mid"}
                            layoutId={edge.name + "-mid"}
                            style={{ pointerEvents: "none" }}
                            initial={{
                                d: curvePointsInit,
                                opacity: 0,
                            }}
                            animate={{
                                d: curvePoints,
                                opacity: 1,
                            }}
                            stroke={edgeColor}
                            strokeWidth={edge!.thickness ?? options.textSize / 10}
                            transition={transition}
                            fill="transparent"
                        />
                        <motion.text
                            key={edge.name + "-text"}
                            layoutId={edge.name + "-text"}
                            textAnchor="middle"
                            fontSize={options.textSize}
                            style={{
                                pointerEvents: "none",
                                paintOrder: "stroke",
                                stroke: textStroke,
                                strokeWidth: 3,
                                strokeLinecap: "butt",
                                strokeLinejoin: "miter",
                                fontWeight: 600,
                            }}
                            fill={labelColor}
                            initial={{
                                x: edge.points.fromNormal.x,
                                y: edge.points.fromNormal.y,
                                opacity: 0,
                            }}
                            animate={{
                                x: edge.points.fromNormal.x,
                                y: edge.points.fromNormal.y,
                                opacity: 1,
                            }}
                            transition={transition}
                        >
                            {edge.label}
                        </motion.text>
                    </>
                );
            })}
        </>
    );
});
