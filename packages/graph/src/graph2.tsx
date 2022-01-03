import { flatten, groupBy, keyBy, mapValues } from "lodash";
import * as React from "react";
import { FC, useMemo } from "react";
import { Layout, minMax } from "./model";
import { RectIt } from "./svg-react";
import { motion } from "framer-motion";

interface GraphProps {
    graph: Layout;
    // feed: { to: string | null; messages: MessageProps[] }[];
    onSelectNode: (args: { name: string }) => void;
    // selectedNode?: string | null;
}

// type FeedType = { [nodeName: string]: { count: number; messages: MessageArrived[] | undefined } | undefined };
export const Graph2: FC<GraphProps> = ({ graph: { edges, nodes, minPoint, maxPoint, expanded,textSize }, onSelectNode }) => {
    const edgesPerNode = useMemo(() => groupBy(edges, (e) => e.from), [edges]);
    const nodesAndEdges = useMemo(() => {
        return nodes.map((node) => {
            const edges = (edgesPerNode[node.name] || [])
                .filter((e) => !e.hierarchical)
            return { ...node, edges };
        });
    }, [nodes, edgesPerNode]);
    const leafNodes = nodesAndEdges.filter((n) => n.parent && expanded.includes(n.parent) && n.level === 1);
    const level2NodesDict = groupBy(leafNodes, (n) => n.parent);
    const nodeDict = keyBy(nodesAndEdges, (n) => n.name);
    const level2MinMax = mapValues(level2NodesDict, (childNodes) => minMax(childNodes, textSize));
    const level2NodesMinMax = Object.keys(level2NodesDict)
        .filter((k) => !!k && k !== "" && level2MinMax[k])
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

    const comps = [
        ...level2NodesMinMax.map((node) => (
            <RectIt
                key={node.name}
                size={node.size}
                position={node.position}
                name={node.name}
                fillColor="#404060"
                borderColor="#6060a0"
                textColor="white"
                onSelectNode={onSelectNode}
                textSize={textSize}
            />
        )),
        ...nodesAndEdges.map((node) => (
            <RectIt
                key={node.name}
                size={node.size}
                position={node.position}
                name={node.name}
                fillColor="#406040"
                borderColor="#60a060"
                onSelectNode={onSelectNode}
                textSize={textSize}
                textColor="white"
            />
        )),
    ];

    return (
        <motion.svg
            key="main"
            initial={{
                viewBox: `${minPoint.x} ${minPoint.y} ${maxPoint.x - minPoint.x} ${maxPoint.y - minPoint.y}`,
            }}
            animate={{
                viewBox: `${minPoint.x} ${minPoint.y} ${maxPoint.x - minPoint.x} ${maxPoint.y - minPoint.y}`,
            }}
            transition={{
                type: "easeInOut",
                duration: 0.5,
            }}
            width="100%"
            height="100%"
        >
            {comps}
            {flatten(
                nodesAndEdges.map((node) =>
                    node.edges.map((edge) => (
                        <motion.path
                            key={edge.name}
                            layoutId={edge.name}
                            initial={{
                                d: `M ${edge.points[0].x}, ${edge.points[0].y} L ${edge.points[2].x}, ${edge.points[2].y}`,
                                opacity:0
                            }}
                            animate={{
                                d: `M ${edge.points[0].x}, ${edge.points[0].y} L ${edge.points[2].x}, ${edge.points[2].y}`,
                                opacity:1

                            }}
                            transition={{
                                type: "easeInOut",
                                duration: 0.5,
                            }}
                            stroke="white"
                            strokeWidth={node.size.width / 80}
                        />
                    ))
                )
            )}
        </motion.svg>
    );
};
