import { motion } from "framer-motion";
import * as React from "react";
import { FC, useCallback } from "react";
import { Point, Size } from "./model";
import { Text } from "@visx/text";

interface RectProps {
    name: string;
    size: Size;
    position: Point;
    fillColor?: string;
    borderColor?: string;
    textColor?: string;
    textSize?: number;
    onSelectNode?: (args: { name: string }) => void;
}

export const RectIt: FC<RectProps> = ({
    name,
    position,
    size,
    fillColor = "rgba(0,0,255,0.2)",
    borderColor = "white",
    textColor = "white",
    textSize,
    onSelectNode,
}) => {
    const onClick = useCallback(() => {
        if (onSelectNode) onSelectNode({ name });
    }, [onSelectNode, name]);
    // const parts = useText({
    //     textAnchor: "middle",
    //     dominantBaseline: "middle",
    //     fontSize: textSize ?? size.height / 3,
    //     children: name,
    // });
    return (
        <>
            <motion.g
                key={name}
                layoutId={name}
                initial={{
                    opacity: 0,
                    width: size.width,
                    height: size.height,
                    x: position.x - size.width / 2,
                    y: position.y - size.height / 2,
                    fill: fillColor,
                    stroke: borderColor,
                }}
                animate={{
                    opacity: 1,
                    width: size.width,
                    height: size.height,
                    x: position.x - size.width / 2,
                    y: position.y - size.height / 2,
                    fill: fillColor,
                    stroke: borderColor,
                }}
                transition={{
                    type: "easeInOut",
                    duration: 0.5,
                }}
            >
                <motion.rect
                    key={"rect"}
                    initial={{
                        opacity: 0,
                        width: size.width,
                        height: size.height,
                        fill: fillColor,
                        stroke: borderColor,
                        rx: size.width / 20,
                        ry: size.height / 20,
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
                    transition={{
                        type: "easeInOut",
                        duration: 0.5,
                    }}
                    width={size.width}
                    height={size.height}
                    x={0}
                    y={0}
                    fill={fillColor}
                    stroke={borderColor}
                    strokeWidth={size.width / 100}
                    onClick={onClick}
                />
                <Text
                    key={`text`}
                    style={{ fill: "white", strokeWidth: 0 }}
                    textAnchor="middle"
                    dx={size.width / 2}
                    dy={size.height / 2}
                    width={size.width}
                    verticalAnchor="middle"
                    fontSize={textSize ?? size.height / 4}
                >
                    {name}
                </Text>
            </motion.g>
        </>
    );
};
