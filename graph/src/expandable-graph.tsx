import { Box, useStyleConfig } from "@chakra-ui/react";
import { keyBy, mapValues } from "lodash";
import * as React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Edges } from "./components/edges";
import { MiniGraph, MiniGraphProps } from "./components/mini-graph";
import { SvgContainer } from "./components/svg-container";
import { getVisibleNode, useDefaultNodes } from "./hooks/dynamic-nodes";
import { GraphOptions, SimpleEdge, Size, zeroPoint } from "./hooks/model";
import { useBubbledPositions, useChildrenNodesByParent, useDefaultOptions } from "./hooks/use-ngraph";
import { useDimensions } from "./use-dimensions";

export interface ExpandableGraphProps
    extends Pick<
        MiniGraphProps,
        | "onSelectNode"
        | "selectedNodes"
        | "simpleNodes"
        | "edgeInNodes"
        | "edgeOutNodes"
        | "onEdgeInNode"
        | "onEdgeOutNode"
        | "onExpandToggleNode"
    > {
    simpleEdges: SimpleEdge[];
    expanded: string[];
    options?: GraphOptions;
}

export const ExpandableGraph = memo<ExpandableGraphProps>(
    ({
        simpleEdges,
        simpleNodes,
        onSelectNode,
        edgeInNodes,
        edgeOutNodes,
        onEdgeInNode,
        onEdgeOutNode,
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
        const filteredEdges = useMemo(
            () => routedEdges.filter((e) => edgeInNodes.includes(e.to) || edgeOutNodes.includes(e.from)),
            [edgeInNodes, edgeOutNodes, routedEdges]
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
                            edgeInNodes={edgeInNodes}
                            edgeOutNodes={edgeOutNodes}
                            onEdgeInNode={onEdgeInNode}
                            onEdgeOutNode={onEdgeOutNode}
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
                        edges={filteredEdges}
                        positionDict={edgeNodePositions}
                        nodesDict={nodesDict}
                        options={options}
                    />
                </SvgContainer>
            </Box>
        );
    }
);
