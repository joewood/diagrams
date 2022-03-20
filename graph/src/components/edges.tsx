import { motion, Point } from "framer-motion";
import { groupBy, sumBy } from "lodash";
import * as React from "react";
import { memo, useMemo } from "react";
import { getAnchors } from "../hooks/calc-best-anchors";
import { RequiredGraphOptions, SimpleEdge, SimpleNode, Size, transition } from "../hooks/model";
import { useColorModeValue } from "@chakra-ui/react";
import { mix } from "chroma-js";
import { Edge } from "./edge";

const arrowHeight = 6;
const arrowWidth = 7;

interface Props {
    positionDict: Record<string, { screenPosition: Point; size: Size }>;
    nodesDict: Record<string, SimpleNode>;
    edges: SimpleEdge[];
    name: string;
    selected?: string[];
    options: Pick<RequiredGraphOptions, "defaultWidth" | "defaultHeight" | "textSize" | "iterations" | "nodeMargin">;
}

export const Edges = memo<Props>(({ edges, positionDict, nodesDict, selected, options }) => {
    // get the containing rectangle
    // adjust the position of the nodes to fit within the targetArea
    const layoutEdges = useMemo(() => {
        const groupedEdges = groupBy(edges, (e) => `${e.from}-${e.to}`) as Record<string, SimpleEdge[]>;
        const uniqueEdges = Object.values(groupedEdges).map((edgesInGroup) => ({
            ...edgesInGroup[0],
            thickness: Math.log10(sumBy(edgesInGroup, (ee) => 1.5)) + 1,
            label: edgesInGroup.length > 1 ? undefined : edgesInGroup[0].label,
        }));
        return uniqueEdges
            .filter((edge) => edge.from !== edge.to)
            .map((e) => {
                const nodeFrom = positionDict[e?.from];
                const nodeTo = positionDict[e?.to];
                if (!nodeFrom || !nodeTo) {
                    return null;
                }
                const anchors = getAnchors(
                    nodeTo.screenPosition,
                    nodeTo.size ?? { width: options.defaultWidth, height: options.defaultHeight },
                    nodeFrom.screenPosition,
                    nodeFrom.size ?? { width: options.defaultWidth, height: options.defaultHeight },
                    arrowHeight * e.thickness
                );
                return { ...e, points: anchors };
            })
            .filter((e) => e !== null);
    }, [edges, options.defaultHeight, options.defaultWidth, positionDict]);
    return (
        <>
            {layoutEdges.map((edge) => {
                if (!edge) return null;
                return (
                    <Edge
                        points={edge.points}
                        edge={edge}
                        thickness={edge.thickness}
                        nodesDict={nodesDict}
                        options={options}
                        key={edge.name}
                    />
                );
            })}
        </>
    );
});
