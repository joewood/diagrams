import { Point } from "framer-motion";
import * as React from "react";
import { FC } from "react";
import { unitVector } from "../hooks/use-screen-vector";

const _arrowWidth = 50;

export const Arrow: FC<{ start: Point; end: Point; arrowWidth?: number }> = ({
    start,
    end,
    arrowWidth = _arrowWidth,
}) => {
    const unit = unitVector(end.x - start.x, end.y - start.y);
    const stemX = end.x + (arrowWidth / 2) * unit.x * -1;
    const stemY = end.y + (arrowWidth / 2) * unit.y * -1;

    return (
        <>
            <polygon
                points={`${stemX + (unit.y * arrowWidth) / 2},${stemY - (unit.x * arrowWidth) / 2}
                        ${end.x},${end.y}
                        ${stemX - (unit.y * arrowWidth) / 2},${stemY + (unit.x * arrowWidth) / 2}
                        `}
                fill="currentColor"
            />
            <line x1={stemX} y1={stemY} x2={start.x} y2={start.y} stroke="currentColor" strokeWidth={8} />
        </>
    );
};
