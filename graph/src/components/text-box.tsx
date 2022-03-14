import { motion } from "framer-motion";
import * as React from "react";
import { FC, useCallback } from "react";
import { Point, Size, transition } from "../hooks/model";
import { Text, useText } from "@visx/text";

interface Props {
    name: string;
    initialSize: Size;
    size: Size;
    initialCenterPos: Point;
    centerPos: Point;
    fillColor?: string;
    borderColor?: string;
    borderThickness?: number;
    textColor?: string;
    textSize?: number | string;
    text?: string;
    verticalAnchor?: "start" | "end" | "middle";
    textAnchor?: "start" | "middle" | "end" | "inherit";
    filter?: string;
    selected?: boolean;
    curved?: boolean;
    onSelectNode?: (args: { name: string; selected: boolean }) => void;
}

export const TextBox: FC<Props> = ({
    name,
    initialCenterPos,
    initialSize,
    centerPos,
    size,
    fillColor = "transparent",
    borderColor,
    textColor = "black",
    borderThickness,
    textAnchor = "middle",
    verticalAnchor = "middle",
    textSize,
    text,
    curved,
    filter,
    onSelectNode,
    selected,
    children,
}) => {
    const onClick = useCallback(() => {
        if (onSelectNode) onSelectNode({ name, selected: !selected });
    }, [onSelectNode, name, selected]);
    // const x = useText({})
    const textSizeDefaulted = textSize ?? size.height / 4;
    return (
        <>
            <motion.g
                key={name}
                layoutId={name}
                initial={{
                    opacity: 0,
                    // width: initialSizeDefaulted.width,
                    // height: initialSizeDefaulted.height,
                    x: initialCenterPos.x, //- initialSize.width / 2,
                    y: initialCenterPos.y, //- initialSize.height / 2,
                    fill: fillColor,
                    stroke: borderColor,
                }}
                animate={{
                    opacity: 1,
                    x: centerPos.x, //- size.width / 2,
                    y: centerPos.y, //- size.height / 2,
                    fill: fillColor,
                    stroke: borderColor,
                }}
                transition={transition}
            >
                <motion.rect
                    layoutId={name + "-rect"}
                    initial={{
                        opacity: 0,
                        width: initialSize.width,
                        height: initialSize.height,
                        x: (-1 * initialSize.width) / 2,
                        y: (-1 * initialSize.height) / 2,
                        fill: fillColor,
                        stroke: borderColor,
                        rx: !curved ? 0 : initialSize.width / 20,
                        ry: !curved ? 0 : initialSize.height / 20,
                    }}
                    animate={{
                        opacity: 1,
                        width: size.width,
                        height: size.height,
                        x: (-1 * size.width) / 2,
                        y: (-1 * size.height) / 2,
                        fill: fillColor,
                        stroke: borderColor,
                        rx: !curved ? 0 : size.width / 20,
                        ry: !curved ? 0 : size.height / 20,
                    }}
                    transition={transition}
                    fill={fillColor}
                    filter={filter}
                    stroke={borderColor}
                    strokeWidth={borderThickness}
                    onClick={onClick}
                />
                <Text
                    style={{ fill: textColor, strokeWidth: 0, userSelect: "none" }}
                    textAnchor={textAnchor}
                    verticalAnchor={verticalAnchor}
                    x={0}
                    y={0}
                    width={size.width}
                    height={size.height}
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
