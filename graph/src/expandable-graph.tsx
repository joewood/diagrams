import { mix } from "chroma-js";
import { keyBy, mapValues } from "lodash";
import * as React from "react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Edges } from "./edges";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { getVisibleNode, GraphOptions, PositionedEdge, SimpleEdge, SimpleNode, Size, zeroPoint } from "./model";
import { SvgContainer } from "./svg-container";
import { useDimensions } from "./use-dimensions";
import { useChanged, useChildrenNodesByParent, useDefaultOptions, useEdges } from "./use-ngraph";

type ReuseMiniGraphProps = "onSelectNode" | "selectedNode" | "onExpandToggleNode";

export interface ExpandableGraphProps extends Pick<Required<MiniGraphProps>, ReuseMiniGraphProps> {
    nodes: SimpleNode[];
    edges: SimpleEdge[];
    expanded: string[];
    options?: GraphOptions;
}

const emptyArray: PositionedEdge[] = [];

export const ExpandableGraph: FC<ExpandableGraphProps> = ({
    edges,
    nodes,
    onSelectNode,
    selectedNode,
    onExpandToggleNode,
    expanded,
    options: _options = {},
}) => {
    useChanged("Ex edges", edges);
    useChanged("Ex nodes", nodes);
    useChanged("Ex onSelectNode", onSelectNode);
    useChanged("Ex expanded", expanded);
    useChanged("Ex options", _options);

    const options = useDefaultOptions(_options);
    // const [ref, { size: targetSize }] = useDimensions<HTMLDivElement>();
    const [nodeSizes, setNodeSizes] = useState<Record<string, Size>>({});
    const nodesDict = useMemo(() => keyBy(nodes, (n) => n.name), [nodes]);
    const topLevelNodes = useMemo(() => nodes.filter((n) => !n.parent), [nodes]);
    const topLevelNodesDict = useMemo(() => keyBy(topLevelNodes, (l) => l.name), [topLevelNodes]);
    const [size, setSize] = useState({ width: 100, height: 100 });

    // CALLBACKS
    // Resize Demand - change the state
    const onResizeGraph = useCallback((name: string, overlapping: boolean, shrinking: boolean) => {
        if (overlapping) {
            setSize((old) => ({ width: old.width * 1.1, height: old.height * 1.1 }));
        }
        if (shrinking) {
            setSize((old) => ({ width: old.width * 0.9, height: old.height * 0.9 }));
        }
    }, []);
    const onResizeNode = useCallback(
        (name: string, overflow: boolean, shrinking: boolean) => {
            if (overflow) {
                console.log("overflow " + name, nodeSizes);
                setNodeSizes((sz) => ({
                    ...sz,
                    [name]: {
                        width: (sz[name]?.width ?? options.defaultSize.width) * 1.1,
                        height: (sz[name]?.height ?? options.defaultSize.height) * 1.1,
                    },
                }));
            }
            if (shrinking) {
                console.log("shrink " + name, nodeSizes);
                setNodeSizes((sz) => ({
                    ...sz,
                    [name]: {
                        width: (sz[name]?.width ?? options.defaultSize.width) * 0.9,
                        height: (sz[name]?.height ?? options.defaultSize.height) * 0.9,
                    },
                }));
            }
        },
        [nodeSizes, options.defaultSize.height, options.defaultSize.width]
    );

    // reflect any changes in the expanded by removing size overrides
    useEffect(() => {
        setNodeSizes((prev) => {
            const unExpanded = Object.keys(prev).filter((s) => !expanded.includes(s));
            const newNodeSizes = { ...prev };
            let dirty = false;
            for (const deleteKey of unExpanded) {
                if (deleteKey in newNodeSizes) {
                    delete newNodeSizes[deleteKey];
                    dirty = true;
                }
            }
            return dirty ? newNodeSizes : prev;
        });
    }, [expanded]);
    const [screenNodesDict, posEdges, onNodesMoved] = useEdges();

    const reroutedNodesDict = useMemo(
        () => mapValues(nodesDict, (n) => getVisibleNode(n, topLevelNodesDict, nodesDict, expanded)),
        [expanded, topLevelNodesDict, nodesDict]
    );
    const routedEdges = useMemo(
        () =>
            edges.map((edge) => ({
                ...edge,
                to: reroutedNodesDict[edge.to].name,
                from: reroutedNodesDict[edge.from].name,
            })),
        [edges, reroutedNodesDict]
    );

    const expandedChildNodes = useMemo(
        () => nodes.filter((n) => n.parent !== null && expanded.includes(n.parent)),
        [expanded, nodes]
    );
    const [nodesByParent] = useChildrenNodesByParent(expandedChildNodes, screenNodesDict, options);
    const parentNodes = useMemo(
        () =>
            topLevelNodes.map((node) => ({
                ...node,
                size: nodeSizes[node.name] ?? node.size ?? options.defaultSize,
                expanded: expanded.includes(node.name),
                border: expanded.includes(node.name)
                    ? mix(node.backgroundColor ?? "gray", "black", 0.6).css()
                    : mix(node.backgroundColor ?? "gray", "black", 0.3).css(),
                backgroundColor: mix(node.backgroundColor ?? "gray", "rgba(255,255,255,0)", 0.3).css(),
            })),
        [expanded, topLevelNodes, nodeSizes, options.defaultSize]
    );

    // render a given Node as a sub-graph
    const renderNodeAsGraph = useCallback<Required<MiniGraphProps>["renderNode"]>(
        (screenNode, onSelectNode, options) =>
            (nodesByParent[screenNode.name] && (
                <MiniGraph
                    key={screenNode.name + "-graph"}
                    nodes={nodesByParent[screenNode.name]}
                    edges={emptyArray}
                    renderNode={renderNodeAsGraph}
                    name={screenNode.name}
                    onSelectNode={onSelectNode}
                    selectedNode={selectedNode}
                    onResizeNeeded={onResizeNode}
                    onExpandToggleNode={onExpandToggleNode}
                    screenSize={screenNode.size}
                    onNodesPositioned={onNodesMoved}
                    screenPosition={screenNode.screenTopLeft}
                    options={options}
                />
            )) ||
            null,
        [nodesByParent, onExpandToggleNode, onNodesMoved, onResizeNode, selectedNode]
    );

    return (
        <div style={{ width: "100%", height: "100%", display: "block", overflow: "auto" }}>
            <SvgContainer key="svg" textSize={options.textSize} screenSize={size}>
                <MiniGraph
                    key="root"
                    nodes={parentNodes}
                    edges={routedEdges}
                    name="root"
                    options={options}
                    onSelectNode={onSelectNode}
                    onExpandToggleNode={onExpandToggleNode}
                    onResizeNeeded={onResizeGraph}
                    screenSize={size}
                    screenPosition={zeroPoint}
                    onNodesPositioned={onNodesMoved}
                    renderNode={renderNodeAsGraph}
                />
                <Edges key="edges" name="root" edges={posEdges} nodes={screenNodesDict} options={options} />
            </SvgContainer>
        </div>
    );
};
