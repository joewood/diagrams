import { Point } from "framer-motion";
import * as React from "react";
import { memo } from "react";
import { useHover } from "../hooks/dynamic-nodes";
import { zeroPoint } from "../hooks/model";
import { Arrow } from "./shapes";

const boundBox: any = "bounding-box";

interface ExpandButtonProps {
    pos?: Point;
    width: number;
    height: number;
    arrowColor: string;
    highlightColor: string;
    onClick: () => void;
    expanded: boolean;
}

export const ExpandButton = memo<ExpandButtonProps>(
    ({ pos = zeroPoint, highlightColor, arrowColor, width, height, expanded, onClick }) => {
        const [hover, mouseEvents] = useHover();
        return (
            <g
                transform={`translate(${pos.x} ${pos.y}),scale(${width / 100} ${height / 100})`}
                width={width}
                height={height}
                style={{ pointerEvents: boundBox, color: hover ? highlightColor : arrowColor }}
                onClick={onClick}
                {...mouseEvents}
            >
                {expanded ? (
                    <>
                        <Arrow start={{ x: 60, y: 60 }} end={{ x: 100, y: 100 }} />
                        <Arrow start={{ x: 60, y: 40 }} end={{ x: 100, y: 0 }} />
                        <Arrow start={{ x: 40, y: 60 }} end={{ x: 0, y: 100 }} />
                        <Arrow start={{ x: 40, y: 40 }} end={{ x: 0, y: 0 }} />
                    </>
                ) : (
                    <>
                        <Arrow end={{ x: 60, y: 60 }} start={{ x: 100, y: 100 }} />
                        <Arrow end={{ x: 60, y: 40 }} start={{ x: 100, y: 0 }} />
                        <Arrow end={{ x: 40, y: 60 }} start={{ x: 0, y: 100 }} />
                        <Arrow end={{ x: 40, y: 40 }} start={{ x: 0, y: 0 }} />
                    </>
                )}
            </g>
        );
    }
);
