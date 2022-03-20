import { flatten, groupBy, keyBy, mapValues } from "lodash";
import * as React from "react";
import { FC, useMemo } from "react";
import { Layout, minMax, transition } from "./model";
import { RectIt } from "./svg-react";
import { motion } from "framer-motion";
import { Text } from "@visx/text";

interface GraphProps {
    graph: Layout;
    // feed: { to: string | null; messages: MessageProps[] }[];
    onSelectNode: (args: { name: string }) => void;
    // selectedNode?: string | null;
}

// type FeedType = { [nodeName: string]: { count: number; messages: MessageArrived[] | undefined } | undefined };
export const Graph2: FC<GraphProps> = ({
    graph: { edges, nodes, minPoint, maxPoint, expanded, textSize },
    onSelectNode,
}) => {
    const edgesPerNode = useMemo(() => groupBy(edges, (e) => e.from), [edges]);
    const nodesAndEdges = useMemo(() => {
        return nodes.map((node) => {
            const edges = edgesPerNode[node.name] || []; 
            return { ...node, edges };
        });
    }, [nodes, edgesPerNode]);
    const leafNodes = nodesAndEdges.filter((n) => n.parent && expanded.includes(n.parent) && n.level === 1);
    const level2NodesDict = groupBy(leafNodes, (n) => n.parent);
    const nodeDict = keyBy(nodesAndEdges, (n) => n.name);
    const level2MinMax = mapValues(level2NodesDict, (childNodes) => minMax(childNodes, textSize));
    const level2NodesMinMax = Object.keys(level2NodesDict)
        // .filter((k) => !!k && k !== "" && level2MinMax[k])
        .map((parent) => ({
            ...nodeDict[parent],
            name: parent,
            position: {
                x: level2MinMax[parent]!.x1 + (level2MinMax[parent]!.x2 - level2MinMax[parent]!.x1) / 2,
                y: level2MinMax[parent]!.y1 + (level2MinMax[parent]!.y2 - level2MinMax[parent]!.y1) / 2,
            },
            size: {
                width: level2MinMax[parent]!.x2 - level2MinMax[parent]!.x1,
                height: level2MinMax[parent]!.y2 - level2MinMax[parent]!.y1,
            },
        }));
    const l2nodeDict = keyBy(level2NodesMinMax, (l) => l.name);
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
            {nodesAndEdges.map((node) => (
                <RectIt
                    key={node.name}
                    size={l2nodeDict[node.name] ? l2nodeDict[node.name].size : node.size}
                    position={l2nodeDict[node.name] ? l2nodeDict[node.name].position : node.position}
                    name={node.name}
                    fillColor={l2nodeDict[node.name] ? "#f8f8ff" : "#e8fff0"}
                    borderColor="#a0a0a0"
                    verticalAnchor={l2nodeDict[node.name] ? "start" : "middle"}
                    onSelectNode={onSelectNode}
                    textSize={textSize}
                    textColor="#404040"
                />
            ))}
            {flatten(
                nodesAndEdges.map((node) =>
                    node.edges.map((edge) => (
                        <>
                            <motion.path
                                key={edge.name}
                                layoutId={edge.name}
                                initial={{
                                    d: `M ${edge.points[0].x}, ${edge.points[0].y} L ${edge.points[2].x}, ${edge.points[2].y}`,
                                    opacity: 0,
                                }}
                                animate={{
                                    d: `M ${edge.points[0].x}, ${edge.points[0].y} L ${edge.points[2].x}, ${edge.points[2].y}`,
                                    opacity: 1,
                                }}
                                markerEnd="url(#arrowhead)"
                                transition={transition}
                                stroke="black"
                                strokeWidth={node.size.width / 80}
                            />
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
                                {edge.label || ""}
                            </motion.text>
                        </>
                    ))
                )
            )}
        </motion.svg>
    );
};
