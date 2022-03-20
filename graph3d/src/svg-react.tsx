import { motion } from "framer-motion";
import * as React from "react";
import { FC, useCallback } from "react";
import { Point, Size, transition } from "./model";
import { Text } from "@visx/text";

interface RectProps {
    name: string;
    size: Size;
    position: Point;
    fillColor?: string;
    borderColor?: string;
    textColor?: string;
    textSize?: number;
    verticalAnchor?: "start" | "end" | "middle";
    onSelectNode?: (args: { name: string }) => void;
}

export const RectIt: FC<RectProps> = ({
    name,
    position,
    size,
    fillColor = "rgba(0,0,255,0.2)",
    borderColor = "white",
    textColor = "white",
    verticalAnchor = "middle",
    textSize,
    onSelectNode,
}) => {
    const onClick = useCallback(() => {
        if (onSelectNode) onSelectNode({ name });
    }, [onSelectNode, name]);
    return (
        <>
            <motion.g
                key={name}
                layoutId={name}
                initial={{
                    opacity: 0,
                    width: size.width,
                    height: size.height,
                    x: position.x,
                    y: position.y,
                    fill: fillColor,
                    stroke: borderColor,
                }}
                animate={{
                    opacity: 1,
                    width: size.width,
                    height: size.height,
                    x: position.x,
                    y: position.y,
                    fill: fillColor,
                    stroke: borderColor,
                }}
                transition={transition}
            >
                <motion.rect
                    layoutId={name + "-rect"}
                    initial={{
                        opacity: 0,
                        width: size.width,
                        height: size.height,
                        fill: fillColor,
                        x: size.width * -0.5,
                        y: size.height * -0.5,
                        stroke: borderColor,
                        rx: size.width / 20,
                        ry: size.height / 20,
                    }}
                    animate={{
                        opacity: 1,
                        width: size.width,
                        height: size.height,
                        fill: fillColor,
                        x: size.width * -0.5,
                        y: size.height * -0.5,
                        stroke: borderColor,
                        rx: size.width / 20,
                        ry: size.height / 20,
                    }}
                    transition={transition}
                    fill={fillColor}
                    stroke={borderColor}
                    strokeWidth={0.2}
                    onClick={onClick}
                />
                <Text
                    style={{ fill: textColor, strokeWidth: 0, userSelect: "none" }}
                    textAnchor="middle"
                    dx={0}
                    dy={0}
                    width={size.width * 0.9}
                    height={size.height * 0.9}
                    verticalAnchor={verticalAnchor}
                    fontWeight="bold"
                    fontSize={textSize ?? size.height / 4}
                >
                    {name}
                </Text>
            </motion.g>
        </>
    );
};
