import { motion } from "framer-motion";
import * as React from "react";
import { FC, ReactNode } from "react";
import { RequiredGraphOptions, Size, transition } from "../hooks/model";

interface Props {
    /** Explicit screen size in pixels, defaults to 100% of container */
    screenSize?: Size;
    /** Text size based on options, this helps define the shadow depth */
    nodeMargin: RequiredGraphOptions["nodeMargin"];
    /** Any additional SVG defs that can be referenced in child nodes and edges */
    defs?: ReactNode;
}

/** Container for the SVG that includes animation setup, markers for arrows and shadow effects */
export const SvgContainer: FC<Props> = ({ children, nodeMargin, screenSize, defs }) => {
    if (!screenSize) return <div>Load</div>;
    const markerWidth = 7;
    const markerHeight = 4;
    return (
        <motion.svg
            animate={{ width: screenSize?.width ?? "100%", height: screenSize?.height ?? "100%" }}
            style={{ margin: "auto" }}
            transition={transition}
        >
            <defs>
                <marker
                    id="arrowhead"
                    markerWidth={markerWidth}
                    markerHeight={markerHeight}
                    refX={markerWidth}
                    refY={markerHeight / 2}
                    orient="auto"
                >
                    <polygon points={`${0} 0, ${markerWidth} ${markerHeight / 2}, ${0} ${markerHeight}`} />
                </marker>
                <filter id="shadow" x="0" y="0" width="200%" height="200%">
                    <feOffset result="offOut" in="SourceGraphic" dx={nodeMargin / 2} dy={nodeMargin / 2} />
                    <feColorMatrix
                        result="matrixOut"
                        in="offOut"
                        type="matrix"
                        values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0"
                    />
                    <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation={nodeMargin / 2} />
                    <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                </filter>
                <filter id="glow" primitiveUnits="userSpaceOnUse">
                    <feGaussianBlur stdDeviation="5" in="SourceGraphic" />
                    <feColorMatrix
                        type="matrix"
                        values={`0 0 0 0 .9 
                                0 0 0 0 .9 
                                0 0 0 0 .9 
                                0 0 0 1 0`}
                    />
                    <feComposite operator="over" in="SourceGraphic" />
                </filter>
                {defs}
            </defs>
            {children}
        </motion.svg>
    );
};
