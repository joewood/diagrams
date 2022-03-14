import { Box, useColorModeValue, useStyleConfig } from "@chakra-ui/react";
import { brewer, mix, scale } from "chroma-js";
import { keyBy, mapValues, uniq } from "lodash";
import * as React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Edges } from "./components/edges";
import { MiniGraph, MiniGraphProps } from "./components/mini-graph";
import { SvgContainer } from "./components/svg-container";
import { getVisibleNode, useDefaultNodes } from "./hooks/dynamic-nodes";
import { GraphOptions, SimpleEdge, SimpleNode, Size, zeroPoint } from "./hooks/model";
import { useBubbledPositions, useChildrenNodesByParent, useDefaultOptions } from "./hooks/use-ngraph";
import { useDimensions } from "./use-dimensions";

export function getAllChildrenName(n: string, nodesByParent: Record<string, SimpleNode[]>): string[] {
    return [n, ...(nodesByParent[n]?.flatMap((p) => getAllChildrenName(p.name, nodesByParent)) ?? [])];
}

// type ReuseMiniGraphProps = "onSelectNode" | "selectedNode" | "onExpandToggleNode" |"";
export function useExpandToggle(nodes: SimpleNode[]): [string[], Required<ExpandableGraphProps>["onExpandToggleNode"]] {
    const [expanded, setExpanded] = useState<string[]>([]);
    const nodesByParent = useChildrenNodesByParent(nodes);
    const onExpandToggleNode = useCallback<Required<ExpandableGraphProps>["onExpandToggleNode"]>(
        ({ name, expand }) => {
            setExpanded((previous) => {
                if (expand) return uniq([...previous, name]);
                const childrenNames = getAllChildrenName(name, nodesByParent);
                return previous.filter((e) => !childrenNames.includes(e));
            });
        },
        [nodesByParent]
    );
    return [expanded, onExpandToggleNode];
}

export function useSelectNodes(nodes: SimpleNode[]): [string[], Required<ExpandableGraphProps>["onSelectNode"]] {
    const [selectedNode, setSelectedNode] = useState<string[]>([]);
    const nodesByParent = useChildrenNodesByParent(nodes);
    const onSelectNode = useCallback<Required<ExpandableGraphProps>["onSelectNode"]>(
        ({ name, selected }) => {
            setSelectedNode((prev) => {
                const childrenNames = getAllChildrenName(name, nodesByParent);
                return !selected ? prev.filter((p) => !childrenNames.includes(p)) : uniq([...prev, ...childrenNames]);
            });
        },
        [nodesByParent]
    );
    return [selectedNode, onSelectNode];
}

export interface ExpandableGraphProps
    extends Pick<MiniGraphProps, "onSelectNode" | "selectedNodes" | "simpleNodes" | "onExpandToggleNode"> {
    simpleEdges: SimpleEdge[];
    expanded: string[];
    options?: GraphOptions;
}

export const ExpandableGraph = memo<ExpandableGraphProps>(
    ({
        simpleEdges,
        simpleNodes,
        onSelectNode,
        selectedNodes,
        onExpandToggleNode,
        expanded,
        options: _options = {},
    }) => {
        const [zoom] = useState(1);
        const options = useDefaultOptions(_options, zoom);

        const [dimensionsRef, { size: targetSize }] = useDimensions<HTMLDivElement>();
        const defaultContainerSize = useMemo(
            () => (targetSize && { width: targetSize.width, height: targetSize.height }) || undefined,
            [targetSize]
        );
        // Resize Demand - change the state
        const [graphSize, setGraphSize] = useState<Size>();
        const onResizeNeeded = useCallback<MiniGraphProps["onResizeNeeded"]>((name, { suggestedSize }) => {
            setGraphSize(suggestedSize);
        }, []);
        useEffect(() => {
            setGraphSize((oldGraphSize) => (!oldGraphSize ? defaultContainerSize : oldGraphSize));
        }, [defaultContainerSize]);

        const defaultSimpleNodes = useDefaultNodes(simpleNodes);
        const nodesDict = useMemo(() => keyBy(defaultSimpleNodes, (n) => n.name), [defaultSimpleNodes]);
        const topLevelNodes = useMemo(() => defaultSimpleNodes.filter((n) => !n.parent), [defaultSimpleNodes]);
        const topLevelNodesDict = useMemo(() => keyBy(topLevelNodes, (l) => l.name), [topLevelNodes]);

        const [edgeNodePositions, onBubblePositions] = useBubbledPositions();

        const reroutedNodesDict = useMemo(
            () => mapValues(nodesDict, (n) => getVisibleNode(n, topLevelNodesDict, nodesDict, expanded)),
            [expanded, topLevelNodesDict, nodesDict]
        );
        const routedEdges = useMemo(
            () =>
                simpleEdges.map((edge) => ({
                    ...edge,
                    to: reroutedNodesDict[edge.to].name,
                    originalTo: edge.to,
                    from: reroutedNodesDict[edge.from].name,
                    originalFrom: edge.from,
                })),
            [simpleEdges, reroutedNodesDict]
        );
        const selectedEdges = useMemo(
            () =>
                routedEdges
                    .filter((s) => !selectedNodes || selectedNodes.includes(s.from) || selectedNodes.includes(s.to))
                    .map((s) => s.name),
            [routedEdges, selectedNodes]
        );
        const nodesByParent = useChildrenNodesByParent(defaultSimpleNodes);
        const onGetSubgraph = useCallback((name: string) => nodesByParent[name], [nodesByParent]);
        const parentNodes = useMemo(
            () =>
                topLevelNodes.map((node, index) => {
                    const size = node.size ?? { width: options.defaultWidth, height: options.defaultHeight };
                    return { ...node, size };
                }),
            [topLevelNodes, options.defaultWidth, options.defaultHeight]
        );
        const localSimpleEdges = useMemo(() => {
            if (!parentNodes) return [];
            const subNodesDict = keyBy(parentNodes, (s) => s.name);
            return routedEdges.filter((e) => subNodesDict[e.from] && subNodesDict[e.to]);
        }, [parentNodes, routedEdges]);

        const styles = useStyleConfig("Graph");
        return (
            <Box ref={dimensionsRef} width="100%" height="100%" overflow="auto" sx={styles}>
                <SvgContainer key="svg" nodeMargin={options.nodeMargin} screenSize={graphSize}>
                    {graphSize && (
                        <MiniGraph
                            key="root"
                            name="root"
                            simpleNodes={parentNodes}
                            allRoutedSimpleEdges={routedEdges}
                            localSimpleEdges={localSimpleEdges}
                            options={options}
                            onSelectNode={onSelectNode}
                            selectedNodes={selectedNodes}
                            onGetSubgraph={onGetSubgraph}
                            onExpandToggleNode={onExpandToggleNode}
                            expanded={expanded}
                            onResizeNeeded={onResizeNeeded}
                            screenSize={graphSize}
                            screenPosition={zeroPoint}
                            onBubblePositions={onBubblePositions}
                        />
                    )}
                    <Edges
                        key="edges"
                        name="root"
                        selected={selectedEdges}
                        edges={routedEdges}
                        positionDict={edgeNodePositions}
                        nodesDict={nodesDict}
                        options={options}
                    />
                </SvgContainer>
            </Box>
        );
    }
);
