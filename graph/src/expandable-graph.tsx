import { mix } from "chroma-js";
import { keyBy, mapValues } from "lodash";
import * as React from "react";
import { FC, memo, useCallback, useMemo } from "react";
import { Edges } from "./edges";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { getVisibleNode, GraphOptions, Size, zeroPoint } from "./model";
import { SvgContainer } from "./svg-container";
import { useDimensions } from "./use-dimensions";
import {
    useChanged,
    useChildrenNodesByParent,
    useDefaultOptions,
    useGraphResize,
    useScreenPositionTracker,
} from "./use-ngraph";

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
        useChanged("Ex edges", simpleEdges);
        useChanged("Ex nodes", simpleNodes);
        useChanged("Ex onSelectNode", onSelectNode);
        useChanged("Ex expanded", expanded);
        useChanged("Ex options", _options);

        const options = useDefaultOptions(_options);
        const [ref, { size: targetSize }] = useDimensions<HTMLDivElement>();
        const defaultContainerSize = useMemo(
            () => ({ width: targetSize.width / 2, height: targetSize.height / 2 }),
            [targetSize.height, targetSize.width]
        );
        const nodesDict = useMemo(() => keyBy(simpleNodes, (n) => n.name), [simpleNodes]);
        const topLevelNodes = useMemo(() => simpleNodes.filter((n) => !n.parent), [simpleNodes]);
        const topLevelNodesDict = useMemo(() => keyBy(topLevelNodes, (l) => l.name), [topLevelNodes]);

        // Resize Demand - change the state
        const [graphSize, onResizeGraph] = useGraphResize(undefined, defaultContainerSize, true);
        const [, posSizes, onNodesPositioned] = useScreenPositionTracker([], "GRAPH");

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
        const onGetSubgraph = useCallback((name: string) => nodesByParent[name], [nodesByParent]);
        const parentNodes = useMemo(
            () =>
                topLevelNodes.map((node) => ({
                    ...node,
                    size: node.size ?? options.defaultSize,
                    expanded: expanded.includes(node.name),
                    border: expanded.includes(node.name)
                        ? mix(node.backgroundColor ?? "gray", "black", 0.6).css()
                        : mix(node.backgroundColor ?? "gray", "black", 0.3).css(),
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
                <SvgContainer key="svg" textSize={options.textSize} screenSize={graphSize ?? defaultContainerSize}>
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
                        onResizeNeeded={onResizeGraph}
                        screenSize={graphSize ?? defaultContainerSize}
                        screenPosition={zeroPoint}
                        onNodesPositioned={onNodesPositioned}
                    />
                    <Edges key="edges" name="root" edges={routedEdges} positionDict={posSizes} options={options} />
                </SvgContainer>
            </div>
        );
    }
);
