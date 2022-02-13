import { mix } from "chroma-js";
import { keyBy, mapValues } from "lodash";
import * as React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Edges } from "./edges";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { getVisibleNode, GraphOptions, Size, zeroPoint } from "./model";
import { SvgContainer } from "./svg-container";
import { useDimensions } from "./use-dimensions";
import { useChanged, useChildrenNodesByParent, useDefaultOptions, useBubbledPositions } from "./use-ngraph";

// type ReuseMiniGraphProps = "onSelectNode" | "selectedNode" | "onExpandToggleNode" |"";

export interface ExpandableGraphProps
    extends Pick<
        MiniGraphProps,
        "onSelectNode" | "selectedNode" | "simpleNodes" | "simpleEdges" | "onExpandToggleNode"
    > {
    expanded: string[];
    options?: GraphOptions;
}

export const ExpandableGraph = memo<ExpandableGraphProps>(
    ({
        simpleEdges,
        simpleNodes,
        onSelectNode,
        selectedNode,
        onExpandToggleNode,
        expanded,
        options: _options = {},
    }) => {

        const options = useDefaultOptions(_options);

        const [ref, { size: targetSize }] = useDimensions<HTMLDivElement>();
        const defaultContainerSize = useMemo(
            () => (targetSize && { width: targetSize.width / 2, height: targetSize.height / 2 }) || undefined,
            [targetSize]
        );
        // Resize Demand - change the state
        const [graphSize, setGraphSize] = useState<Size>();
        const onResizeNeeded = useCallback<MiniGraphProps["onResizeNeeded"]>((name, overlapping, shrinking) => {
            setGraphSize(
                (existingSize) =>
                    (existingSize && {
                        width: existingSize.width * (overlapping ? 1.1 : shrinking ? 0.9 : 1),
                        height: existingSize.height * (overlapping ? 1.1 : shrinking ? 0.9 : 1),
                    }) ||
                    undefined
            );
        }, []);
        useEffect(() => {
            setGraphSize((oldGraphSize) => (!oldGraphSize ? defaultContainerSize : oldGraphSize));
        }, [defaultContainerSize]);

        const nodesDict = useMemo(() => keyBy(simpleNodes, (n) => n.name), [simpleNodes]);
        const topLevelNodes = useMemo(() => simpleNodes.filter((n) => !n.parent), [simpleNodes]);
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
                    from: reroutedNodesDict[edge.from].name,
                })),
            [simpleEdges, reroutedNodesDict]
        );

        const nodesByParent = useChildrenNodesByParent(simpleNodes);
        const onGetSubgraph = useCallback(
            (name: string) => {
                return nodesByParent[name];
            },
            [nodesByParent]
        );
        const parentNodes = useMemo(
            () =>
                topLevelNodes.map((node) => ({
                    ...node,
                    size: node.size ?? options.defaultSize,
                    border: mix(
                        node.backgroundColor ?? "gray",
                        "rgba(0,0,0,0)",
                        expanded.includes(node.name) ? 0.6 : 0.3
                    ).css(),
                    backgroundColor: mix(node.backgroundColor ?? "gray", "rgba(255,255,255,0)", 0.3).css(),
                })),
            [topLevelNodes, options.defaultSize, expanded]
        );

        return (
            <div
                ref={ref}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    overflow: "auto",
                    backgroundColor: "#f0f0ff",
                }}
            >
                <SvgContainer key="svg" textSize={options.textSize} screenSize={graphSize}>
                    {graphSize && (
                        <MiniGraph
                            key="root"
                            simpleNodes={parentNodes}
                            simpleEdges={routedEdges}
                            name="root"
                            options={options}
                            onSelectNode={onSelectNode}
                            selectedNode={selectedNode}
                            onGetSubgraph={onGetSubgraph}
                            onExpandToggleNode={onExpandToggleNode}
                            expanded={expanded}
                            level={1}
                            onResizeNeeded={onResizeNeeded}
                            screenSize={graphSize}
                            screenPosition={zeroPoint}
                            onBubblePositions={onBubblePositions}
                        />
                    )}
                    <Edges
                        key="edges"
                        name="root"
                        edges={routedEdges}
                        positionDict={edgeNodePositions}
                        options={options}
                    />
                </SvgContainer>
            </div>
        );
    }
);
