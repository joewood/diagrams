import { motion } from "framer-motion";
import * as React from "react";
import { FC, ReactNode } from "react";
import { RequiredGraphOptions, Size, transition } from "../hooks/model";

interface Props {
    /** Explicit screen size in pixels, defaults to 100% of container */
    screenSize?: Size;
    /** Text size based on options, this helps define the shadow depth */
    textSize: RequiredGraphOptions["textSize"];
    /** Any additional SVG defs that can be referenced in child nodes and edges */
    defs?: ReactNode;
}

/** Container for the SVG that includes animation setup, markers for arrows and shadow effects */
export const SvgContainer: FC<Props> = ({ children, textSize, screenSize, defs }) => {
    if (!screenSize) return <div>Load</div>;
    return (
        <motion.svg
            animate={{ width: screenSize?.width ?? "100%", height: screenSize?.height ?? "100%" }}
            transition={transition}
        >
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
                <filter id="shadow" x="0" y="0" width="200%" height="200%">
                    <feOffset result="offOut" in="SourceGraphic" dx={textSize} dy={textSize} />
                    <feColorMatrix
                        result="matrixOut"
                        in="offOut"
                        type="matrix"
                        values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0"
                    />
                    <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation={textSize} />
                    <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                </filter>
                {defs}
            </defs>
            {children}
        </motion.svg>
    );
};
