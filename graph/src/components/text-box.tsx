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
    textMarginWidth?: number;
    fillColor?: string;
    borderColor?: string;
    borderThickness?: number;
    textColor?: string;
    textSize?: number | string;
    text?: string;
    radiusTopLeft?: number;
    radiusTopRight?: number;
    radiusBottomRight?: number;
    radiusBottomLeft?: number;
    verticalAnchor?: "start" | "end" | "middle";
    textAnchor?: "start" | "middle" | "end" | "inherit";
    filter?: string;
    selected?: boolean;
    onSelectNode?: (args: { name: string; selected: boolean }) => void;
}

export const TextBox: FC<Props> = ({
    name,
    initialCenterPos,
    initialSize,
    centerPos,
    size,
    textMarginWidth = 0,
    fillColor = "transparent",
    borderColor,
    textColor = "black",
    borderThickness,
    textAnchor = "middle",
    verticalAnchor = "middle",
    textSize,
    text,
    radiusTopRight,
    radiusTopLeft,
    radiusBottomRight,
    radiusBottomLeft,
    filter,
    onSelectNode,
    selected,
    children,
}) => {
    const onClick = useCallback(() => {
        if (onSelectNode) onSelectNode({ name, selected: !selected });
    }, [onSelectNode, name, selected]);
    const textSizeDefaulted = textSize ?? size.height / 4;
    return (
        <>
            <motion.g
                key={name}
                layoutId={name}
                style={{ pointerEvents: "none" }}
                initial={{
                    opacity: 0,
                    x: initialCenterPos.x,
                    y: initialCenterPos.y,
                    fill: fillColor,
                    stroke: borderColor,
                }}
                animate={{
                    opacity: 1,
                    x: centerPos.x,
                    y: centerPos.y,
                    fill: fillColor,
                    stroke: borderColor,
                }}
                transition={transition}
            >
                <motion.path
                    layoutId={name + "-rect"}
                    initial={{
                        opacity: 0,
                        d: `
                            M${-0.5 * initialSize.width + (radiusTopLeft ?? 0)},${-0.5 * initialSize.height}
                            h${initialSize.width - (radiusTopRight ?? 0) - (radiusTopLeft ?? 0)}
                            q${radiusTopRight ?? 0},0 ${radiusTopRight ?? 0},${radiusTopRight ?? 0}
                            v${initialSize.height - (radiusTopRight ?? 0) - (radiusBottomRight ?? 0)}
                            q0,${radiusBottomRight ?? 0} ${-1 * (radiusBottomRight ?? 0)},${radiusBottomRight ?? 0}
                            h${-1 * initialSize.width + (radiusBottomRight ?? 0) + (radiusBottomLeft ?? 0)}
                            q${-1 * (radiusBottomLeft ?? 0)},0 ${-1 * (radiusBottomLeft ?? 0)},${
                            -1 * (radiusBottomLeft ?? 0)
                        }
                            v${-1 * initialSize.height + (radiusTopLeft ?? 0) + (radiusBottomLeft ?? 0)}
                            q0,${-1 * (radiusTopLeft ?? 0)} ${radiusTopLeft ?? 0},${-1 * (radiusTopLeft ?? 0)}
                            z  `,
                        fill: fillColor,
                        stroke: borderColor,
                    }}
                    animate={{
                        opacity: 1,
                        d: `
                            M${-0.5 * size.width + (radiusTopLeft ?? 0)},${-0.5 * size.height}
                            h${size.width - (radiusTopRight ?? 0) - (radiusTopLeft ?? 0)}
                            q${radiusTopRight ?? 0},0 ${radiusTopRight ?? 0},${radiusTopRight ?? 0}
                            v${size.height - (radiusTopRight ?? 0) - (radiusBottomRight ?? 0)}
                            q0,${radiusBottomRight ?? 0} ${-1 * (radiusBottomRight ?? 0)},${radiusBottomRight ?? 0}
                            h${-1 * size.width + (radiusBottomRight ?? 0) + (radiusBottomLeft ?? 0)}
                            q${-1 * (radiusBottomLeft ?? 0)},0 ${-1 * (radiusBottomLeft ?? 0)},${
                            -1 * (radiusBottomLeft ?? 0)
                        }
                            v${-1 * size.height + (radiusTopLeft ?? 0) + (radiusBottomLeft ?? 0)}
                            q0,${-1 * (radiusTopLeft ?? 0)} ${radiusTopLeft ?? 0},${-1 * (radiusTopLeft ?? 0)}
                            z  `,
                        fill: fillColor,
                        stroke: borderColor,
                    }}
                    transition={transition}
                    fill={fillColor}
                    filter={filter}
                    stroke={borderColor}
                    strokeWidth={borderThickness}
                    onClick={onClick}
                    style={{ pointerEvents: "none" }}
                />
                <Text
                    style={{ fill: textColor, strokeWidth: 0, userSelect: "none" }}
                    textAnchor={textAnchor}
                    verticalAnchor={verticalAnchor}
                    x={0}
                    y={0}
                    width={size.width - textMarginWidth}
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
