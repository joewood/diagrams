import { Point } from "framer-motion";
import * as React from "react";
import { memo, useCallback } from "react";
import { MiniGraphProps } from "..";
import { useHover } from "../hooks/dynamic-nodes";
import { Arrow } from "./shapes";

const boundBox: any = "bounding-box";

interface Props {
    pos: Point;
    width: number;
    height: number;
    highlightColor: string;
    inverseColor:string;
    arrowColor: string;
    flowIn: boolean;
    nodeNames: string[];
    onClick: MiniGraphProps["onEdgeInNode"];
    enabled: boolean;
}

export const FlowButton = memo<Props>(
    ({ pos, arrowColor, width, height, nodeNames, flowIn, highlightColor,inverseColor, onClick, enabled }) => {
        const [over, mouseEvents] = useHover();
        const cb = useCallback(
            () => onClick?.({ names: nodeNames, selected: !enabled }),
            [enabled, nodeNames, onClick]
        );
        return (
            <g
                x={100}
                width={width}
                height={height}
                style={{ pointerEvents: boundBox, color: enabled ? inverseColor : over ? highlightColor : arrowColor }}
                onClick={cb}
                transform={`translate(${pos.x} ${pos.y}),scale(${width / 100} ${height / 100})`}
                {...mouseEvents}
            >
                <rect
                    x={0}
                    y={0}
                    width={100}
                    height={100}
                    fill={enabled ? (over ? highlightColor : arrowColor) : inverseColor}
                />
                {flowIn ? (
                    <>
                        <rect x={5} y={5} width={20} height={90} fill="currentColor" />
                        <Arrow start={{ x: 100, y: 50 }} end={{ x: 28, y: 50 }} arrowWidth={60} />
                    </>
                ) : (
                    <>
                        <rect x={5} y={5} width={20} height={90} fill="currentColor" />
                        <Arrow start={{ x: 28, y: 50 }} end={{ x: 100, y: 50 }} arrowWidth={60} />
                    </>
                )}
            </g>
        );
    }
);
