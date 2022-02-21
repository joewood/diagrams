import { motion } from "framer-motion";
import * as React from "react";
import { FC, useCallback } from "react";
import { Point, Size, transition } from "../hooks/model";
import { Text } from "@visx/text";

interface RectProps {
    name: string;
    initialSize: Size | undefined;
    size: Size;
    initialPosition: Point | undefined;
    position: Point;
    fillColor?: string;
    borderColor?: string;
    borderThickness?:number;
    textColor?: string;
    textSize?: number | string;
    text?: string;
    verticalAnchor?: "start" | "end" | "middle";
    filter?: string;
    onSelectNode?: (args: { name: string }) => void;
}

export const TextBox: FC<RectProps> = ({
    name,
    initialPosition,
    initialSize,
    position,
    size,
    fillColor = "transparent",
    borderColor = "white",
    textColor = "black",
    borderThickness = 2,
    verticalAnchor = "middle",
    textSize,
    text,
    filter,
    onSelectNode,
    children
}) => {
    const onClick = useCallback(() => {
        if (onSelectNode) onSelectNode({ name });
    }, [onSelectNode, name]);
    const textSizeDefaulted = textSize ?? size.height / 4;
    const initialSizeDefaulted = initialSize ?? size;
    const initialPositionDefaulted = initialPosition ?? position;
    return (
        <>
            <motion.g
                key={name}
                layoutId={name}
                initial={{
                    opacity: 0,
                    width: initialSizeDefaulted.width,
                    height: initialSizeDefaulted.height,
                    x: initialPositionDefaulted.x - initialSizeDefaulted.width / 2,
                    y: initialPositionDefaulted.y - initialSizeDefaulted.height / 2,
                    fill: fillColor,
                    stroke: borderColor,
                }}
                animate={{
                    opacity: 1,
                    x: position.x - size.width / 2,
                    y: position.y - size.height / 2,
                    fill: fillColor,
                    stroke: borderColor,
                }}
                transition={transition}
            >
                <motion.rect
                    layoutId={name + "-rect"}
                    initial={{
                        opacity: 0,
                        width: initialSizeDefaulted.width,
                        height: initialSizeDefaulted.height,
                        fill: fillColor,
                        stroke: borderColor,
                        rx: initialSizeDefaulted.width / 20,
                        ry: initialSizeDefaulted.height / 20,
                    }}
                    animate={{
                        opacity: 1,
                        width: size.width,
                        height: size.height,
                        fill: fillColor,
                        stroke: borderColor,
                        rx: size.width / 20,
                        ry: size.height / 20,
                    }}
                    x={0}
                    y={0}
                    transition={transition}
                    fill={fillColor}
                    filter={filter}
                    stroke={borderColor}
                    strokeWidth={borderThickness}
                    onClick={onClick}
                />
                <Text
                    style={{ fill: textColor, strokeWidth: 0, userSelect: "none" }}
                    textAnchor="start"
                    verticalAnchor="start"
                    x={size.width / 20}
                    y={size.height / 20}
                    width={size.width - (size.width * 4) / 20}
                    height={size.height - (size.height * 4) / 20}
                    fontSize={textSizeDefaulted}
                    fontWeight="bold"
                    onClick={onClick}
                >
                    {text ?? name}
                </Text>
                {children}
            </motion.g>
        </>
    );
};
