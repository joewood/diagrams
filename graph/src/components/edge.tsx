import { useColorModeValue } from "@chakra-ui/react";
import { mix } from "chroma-js";
import { motion } from "framer-motion";
import * as React from "react";
import { memo, useState } from "react";
import { AnchorDetails } from "../hooks/calc-best-anchors";
import { useHover, useHoverMotion } from "../hooks/dynamic-nodes";
import { RequiredGraphOptions, SimpleEdge, SimpleNode, transition } from "../hooks/model";

const arrowHeight = 6;
const arrowWidth = 7;

interface Props {
    nodesDict: Record<string, SimpleNode>;
    points: AnchorDetails;
    edge: SimpleEdge;
    thickness: number;
    options: Pick<RequiredGraphOptions, "defaultWidth" | "defaultHeight" | "textSize" | "iterations" | "nodeMargin">;
}

export const Edge = memo<Props>(({ edge, nodesDict, points, thickness, options }) => {
    // get the containing rectangle
    // adjust the position of the nodes to fit within the targetArea
    const [hover, mouseEvents] = useHoverMotion();
    const textStroke = useColorModeValue("rgba(255,255,255,0.3)", "rgba(0,0,0,0.3)");
    const intensify = useColorModeValue("black", "white");
    const blend = useColorModeValue("white", "black");
    const edgeColor = mix(nodesDict[edge.from]?.color ?? "white", blend, 0.2).css();
    const labelColor = mix(edgeColor, intensify, 0.8).css();
    const { toArrowStem, toAnchor, fromAnchor, fromNormal, toNormal, directionX, directionY } = points;
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
    return (
        <>
            {/* We're doing this manually because Chrome doesn't support colored line markers */}
            <motion.polygon
                key={edge.name + "-end"}
                layoutId={edge.name + "-end"}
                style={{ pointerEvents: "visibleStroke" }}
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
                {...mouseEvents}
            />
            <motion.path
                key={edge.name + "-mid"}
                layoutId={edge.name + "-mid"}
                style={{ pointerEvents: "visibleStroke" }}
                initial={{
                    d: curvePointsInit,
                    opacity: 0,
                }}
                animate={{
                    d: curvePoints,
                    opacity: 1,
                }}
                stroke={edgeColor}
                strokeWidth={thickness ?? options.textSize / 10}
                transition={transition}
                fill="transparent"
                {...mouseEvents}
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
                    x: points.fromNormal.x,
                    y: points.fromNormal.y,
                    opacity: 0,
                }}
                animate={{
                    x: points.fromNormal.x,
                    y: points.fromNormal.y,
                    opacity: hover ? 1 : 0,
                }}
                transition={transition}
            >
                {edge.label}
            </motion.text>
        </>
    );
});
