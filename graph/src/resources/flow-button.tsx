import { Point } from "framer-motion";
import * as React from "react";
import { memo, useCallback, useState } from "react";
import { MiniGraphProps } from "..";
import { Arrow } from "./shapes";

interface Props {
    pos: Point;
    width: number;
    height: number;
    borderColor: string;
    arrowColor: string;
    flowIn: boolean;
    nodeNames: string[];
    onClick: MiniGraphProps["onEdgeInNode"];
    enabled: boolean;
}

export const FlowButton = memo<Props>(
    ({ pos, borderColor, arrowColor, width, height, nodeNames, flowIn, enabled, onClick }) => {
        const [over, setOver] = useState(false);
        const onMouseEnter = useCallback(() => setOver(true), []);
        const onMouseLeave = useCallback(() => setOver(false), []);
        const cb = useCallback(() => onClick({ names: nodeNames, selected: true }), [nodeNames, onClick]);
        return (
            <g
                x={100}
                width={width}
                height={height}
                style={{ pointerEvents: "inherit", color: arrowColor }}
                onMouseLeave={onMouseLeave}
                onMouseEnter={onMouseEnter}
                onClick={cb}
                transform={`translate(${pos.x} ${pos.y}),scale(${width / 100} ${height / 100})`}
            >
                <rect
                    fill={over ? borderColor : "transparent"}
                    x1={0}
                    y1={0}
                    stroke={borderColor}
                    strokeWidth={5}
                    width={100}
                    height={100}
                />
                {flowIn ? (
                    <>
                        <rect x={80} y={10} width={10} height={80} fill="currentColor" />
                        <Arrow start={{ x: 20, y: 50 }} end={{ x: 75, y: 50 }} arrowWidth={60} />
                    </>
                ) : (
                    <>
                        <rect x={10} y={10} width={10} height={80} fill="currentColor" />
                        <Arrow start={{ x: 80, y: 50 }} end={{ x: 25, y: 50 }} arrowWidth={60} />
                    </>
                )}
            </g>
        );
    }
);
