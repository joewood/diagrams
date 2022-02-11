import { motion } from "framer-motion";
import * as React from "react";
import { FC } from "react";
import { RequiredGraphOptions, Size, transition } from "./model";

interface Props {
    screenSize?: Size;
    textSize: RequiredGraphOptions["textSize"];
}

export const SvgContainer: FC<Props> = ({ children, textSize, screenSize }) => (
    <motion.svg
        animate={{ width: screenSize?.width ?? "100%", height: screenSize?.height ?? "100%" }}
        transition={transition}
    >
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
            <defs>
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
            </defs>
        </defs>
        {children}
    </motion.svg>
);
