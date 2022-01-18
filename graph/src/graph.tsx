import { motion } from "framer-motion";
import { groupBy, keyBy, mapValues } from "lodash";
import * as React from "react";
import { FC } from "react";
import { getContainingRect, Layout, transition } from "./model";
import { RectIt } from "./svg-react";

export interface GraphProps {
    graph: Layout;
    onSelectNode?: (args: { name: string }) => void;
    selectedNode?: string | null;
    options?: {
        /** display the length of springs between bodies */
        debugSpringLengths?: boolean;
        /** display the hidden edges that group hierarchical nodes */
        debugHierarchicalSprings?: boolean;
        /** display Mass of the node */
        debugMassNode?: boolean;
    };
}

// type FeedType = { [nodeName: string]: { count: number; messages: MessageArrived[] | undefined } | undefined };
export const Graph: FC<GraphProps> = ({
    graph: { edges, nodes, minPoint, maxPoint, textSize },
    onSelectNode,
    options = {},
}) => {
   
    return (
        <motion.svg
            key="main"
            initial={{
                viewBox: `${minPoint.x} ${minPoint.y} ${maxPoint.x - minPoint.x} ${maxPoint.y - minPoint.y}`,
            }}
            animate={{
                viewBox: `${minPoint.x} ${minPoint.y} ${maxPoint.x - minPoint.x} ${maxPoint.y - minPoint.y}`,
            }}
            transition={transition}
            width="100%"
            height="100%"
            style={{ margin: 0, padding: 0 }}
        >
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
            </defs>
            {nodes.map((node) => (
                <RectIt
                    key={node.name}
                    initialPosition={node.position}
                    initialSize={node.size}
                    position={ node.position}
                    size={ node.size}
                    name={`${node.name}`}
                    text={options.debugMassNode ? `${node.name} M:${node.body?.mass}` : node.name}
                    fillColor={`rgba(200,255,240,${1/(node.levelNumber ?? 1)})`}
                    borderColor="#a0a0a0"
                    verticalAnchor={"start" }
                    onSelectNode={onSelectNode}
                    textSize={textSize}
                    textColor="#404040"
                />
            ))}
            {edges
                .filter((e) => options.debugHierarchicalSprings || !e.hide)
                .map((edge) => (
                    <motion.path
                        key={edge.name}
                        layoutId={edge.name}
                        initial={{
                            d: `M ${edge.points[0].x},${edge.points[0].y} L ${edge.points[2].x},${edge.points[2].y}`,
                            opacity: 0,
                        }}
                        animate={{
                            d: `M ${edge.points[0].x}, ${edge.points[0].y} L ${edge.points[2].x}, ${edge.points[2].y}`,
                            opacity: 1,
                        }}
                        stroke="black"
                        strokeWidth={textSize / 10}
                        markerEnd="url(#arrowhead)"
                        transition={transition}
                    />
                ))}
            {edges
                .filter((e) => options.debugHierarchicalSprings || (!e.hide && !!e.label))
                .map((edge) => (
                    <motion.text
                        key={edge.name + "X"}
                        layoutId={edge.name + "X"}
                        textAnchor="middle"
                        fontSize={textSize}
                        fill="#333"
                        initial={{
                            x: edge.points[1].x,
                            y: edge.points[1].y,
                        }}
                        animate={{
                            x: edge.points[1].x,
                            y: edge.points[1].y,
                        }}
                        transition={transition}
                    >
                        {options.debugSpringLengths ? `${edge.label} S:${edge.score}` : edge.label}
                    </motion.text>
                ))}
        </motion.svg>
    );
};
