import { useColorModeValue } from "@chakra-ui/react";
import { brewer, mix, scale } from "chroma-js";
import { keyBy } from "lodash";
import { useMemo } from "react";
import { SimpleNode } from "./model";

const palette = brewer.RdYlGn;
const paletteScale = scale(palette);

export function getVisibleNode(
    node: SimpleNode,
    leafNodes: Record<string, SimpleNode>,
    nodesDict: Record<string, SimpleNode>,
    expanded: string[]
) {
    while (!!node && node.parent !== null && !(leafNodes[node.name] || expanded.includes(node.parent))) {
        node = nodesDict[node.parent ?? null];
    }
    return node;
}

/** recurse through parents to get the color of the node */
function getNodeColor(nodeDict: Record<string, SimpleNode>, node: SimpleNode, blend: string): string {
    const parentColor =
        node?.color ?? (!node || !node.parent ? "#888" : getNodeColor(nodeDict, nodeDict[node.parent], blend));
    return mix(parentColor, blend, 0.2).css();
}


export function useDefaultNodes( simpleNodes: SimpleNode[]) {
    const blend = useColorModeValue("white", "black");
    return useMemo(() => {
        const numberParent = simpleNodes.filter((node) => !node.parent).length;
        let index = 0;
        const topColors = simpleNodes.map((node) => ({
            ...node,
            color: node.color ?? (node.parent ? undefined : paletteScale(index++ / numberParent).css()),
        }));
        const nodesDict = keyBy(topColors, (p) => p.name);
        return topColors.map((node) => ({
            ...node,
            color: node.color ?? getNodeColor(nodesDict, node, blend),
        }));
    }, [blend, simpleNodes]);

}