import { Point } from "framer-motion";
import * as React from "react";
import { memo, useCallback } from "react";
import { MiniGraphProps } from "..";
import { useHover, useHoverMotion, useHoverMotion2 } from "../hooks/dynamic-nodes";
import { Arrow } from "./shapes";

const boundBox: any = "bounding-box";

interface Props {
    pos: Point;
    width: number;
    height: number;
    highlightColor: string;
    inverseColor: string;
    arrowColor: string;
    nodeNames: string[];
    onClick: MiniGraphProps["onFilterEdges"];
    enabled: boolean;
}

export const FlowButton = memo<Props>(
    ({ pos, arrowColor, width, height, nodeNames, highlightColor, inverseColor, onClick, enabled }) => {
        const [over, mouseEvents] = useHoverMotion2();
        const cb = useCallback(() => onClick?.({ names: nodeNames, include: !enabled }), [enabled, nodeNames, onClick]);
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
                <rect x={5} y={5} width={20} height={90} fill="currentColor" />
                <Arrow start={{ x: 100, y: 50 }} end={{ x: 28, y: 50 }} arrowWidth={60} />
            </g>
        );
    }
);
