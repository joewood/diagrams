import { Point } from "framer-motion";
import { svgElements } from "framer-motion/types/render/svg/supported-elements";
import * as React from "react";
import { memo, MouseEventHandler, useCallback, useState } from "react";
import { zeroPoint } from "../hooks/model";
import { Arrow } from "./shapes";

interface ExpandButtonProps {
    pos?: Point;
    width: number;
    height: number;
    borderColor: string;
    arrowColor: string;
    onClick: () => void;
    expanded: boolean;
}

export const ExpandButton = memo<ExpandButtonProps>(
    ({ pos = zeroPoint, borderColor, arrowColor, width, height, expanded, onClick }) => {
        const [over, setOver] = useState(false);
        const onMouseEnter = useCallback<MouseEventHandler<SVGElement>>(() => {
            setOver(true);
        }, []);
        const onMouseLeave = useCallback<MouseEventHandler<SVGElement>>(() => {
            setOver(false);
        }, []);
        return (
            <g
                transform={`translate(${pos.x} ${pos.y}),scale(${width / 100} ${height / 100})`}
                width={width}
                height={height}
                style={{ pointerEvents: "inherit", color: arrowColor }}
                onMouseLeave={onMouseLeave}
                onMouseEnter={onMouseEnter}
                onClick={onClick}
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
                {expanded ? (
                    <>
                        <Arrow start={{ x: 60, y: 60 }} end={{ x: 88, y: 88 }} />
                        <Arrow start={{ x: 60, y: 40 }} end={{ x: 88, y: 12 }} />
                        <Arrow start={{ x: 40, y: 60 }} end={{ x: 12, y: 88 }} />
                        <Arrow start={{ x: 40, y: 40 }} end={{ x: 12, y: 12 }} />
                    </>
                ) : (
                    <>
                        <Arrow end={{ x: 60, y: 60 }} start={{ x: 88, y: 88 }} />
                        <Arrow end={{ x: 60, y: 40 }} start={{ x: 88, y: 12 }} />
                        <Arrow end={{ x: 40, y: 60 }} start={{ x: 12, y: 88 }} />
                        <Arrow end={{ x: 40, y: 40 }} start={{ x: 12, y: 12 }} />
                    </>
                )}
            </g>
        );
    }
);
