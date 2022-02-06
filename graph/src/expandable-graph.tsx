import { mix } from "chroma-js";
import { keyBy, mapValues } from "lodash";
import * as React from "react";
import { FC, useCallback, useMemo } from "react";
import { HierarchicalNode } from ".";
import { Edges } from "./edges";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { GraphOptions, HierarchicalEdge, SimpleNode, zeroPoint } from "./model";
import { SvgContainer } from "./svg-container";
import { useDimensions } from "./use-dimensions";
import { useChildrenNodesByParent, useDefaultOptions, useEdges } from "./use-ngraph";

type ReuseMiniGraphProps = "onSelectNode" | "selectedNode" | "onExpandToggleNode";

export interface ExpandableGraphProps extends Pick<Required<MiniGraphProps>, ReuseMiniGraphProps> {
    nodes: HierarchicalNode[];
    edges: HierarchicalEdge[];
    expanded: string[];
    options?: GraphOptions;
}

function getVisibleNode(
    node: HierarchicalNode,
    leafNodes: Record<string, SimpleNode>,
    nodesDict: Record<string, HierarchicalNode>,
    expanded: string[]
) {
    while (!!node && node.parent !== null && !(leafNodes[node.name] || expanded.includes(node.parent))) {
        node = nodesDict[node.parent];
    }
    return node;
}

export const ExpandableGraph: FC<ExpandableGraphProps> = ({
    edges,
    nodes,
    onSelectNode,
    selectedNode,
    onExpandToggleNode,
    expanded,
    options: _options = {},
}) => {
    // useChanged("edges", edges);
    // useChanged("nodes", nodes);
    // useChanged("onSelectNode", onSelectNode);
    // useChanged("expanded", expanded);
    // useChanged("options", _options);

    const options = useDefaultOptions(_options);
    const [ref, { size: targetSize }] = useDimensions<HTMLDivElement>();

    const leafNodes = useMemo(() => nodes.filter((n) => n.parent === null), [nodes]);
    const leafNodesDict = useMemo(() => keyBy(leafNodes, (l) => l.name), [leafNodes]);
    const routedEdges = useMemo(() => {
        const nodesDict = keyBy(nodes, (n) => n.name);
        const reroutedNodesDict = mapValues(nodesDict, (n) => getVisibleNode(n, leafNodesDict, nodesDict, expanded));
        const routedEdges = edges.map((edge) => ({
            ...edge,
            to: reroutedNodesDict[edge.to].name,
            from: reroutedNodesDict[edge.from].name,
        }));
        return routedEdges;
    }, [edges, expanded, leafNodesDict, nodes]);

    const insideNodes = useMemo(
        () => nodes.filter((n) => n.parent !== null && expanded.includes(n.parent)),
        [expanded, nodes]
    );
    const [nodesByParent] = useChildrenNodesByParent(insideNodes);
    const largeNodes = useMemo(
        () =>
            leafNodes.map((node) => ({
                ...node,
                size: expanded.includes(node.name)
                    ? {
                          width: (node.size ?? options.defaultSize).width * 4,
                          height: (node.size ?? options.defaultSize).height * 4,
                      }
                    : node.size,
                expanded: expanded.includes(node.name),
                border: expanded.includes(node.name)
                    ? mix(node.backgroundColor ?? "gray", "black", 0.6).css()
                    : mix(node.backgroundColor ?? "gray", "black", 0.3).css(),
                backgroundColor: mix(node.backgroundColor ?? "gray", "rgba(255,255,255,0)", 0.3).css(),
            })),
        [expanded, leafNodes, options.defaultSize]
    );
    const [posNodesDict, posEdges, onNodesMoved] = useEdges();
    const renderNode = useCallback<Required<MiniGraphProps>["renderNode"]>(
        (node) =>
            (nodesByParent[node.name] && (
                <MiniGraph
                    key={node.name + "-graph"}
                    nodes={nodesByParent[node.name].map((p) => ({
                        ...p,
                        initialSize: node.size,
                        initialPosition: node.position,
                    }))}
                    edges={[]}
                    renderNode={renderNode}
                    name={node.name + "-graph"}
                    onSelectNode={onSelectNode}
                    selectedNode={selectedNode}
                    onExpandToggleNode={onExpandToggleNode}
                    targetArea={node.size}
                    onNodesPositioned={onNodesMoved}
                    targetOffset={{
                        x: node.position.x - node.size.width / 2,
                        y: node.position.y - node.size.height / 2,
                    }}
                    options={options}
                />
            )) ||
            null,
        [nodesByParent, onExpandToggleNode, onNodesMoved, onSelectNode, options, selectedNode]
    );

    return (
        <div ref={ref} style={{ width: "100%", height: "100%", display: "block" }}>
            <SvgContainer key="svg" textSize={options.textSize}>
                <MiniGraph
                    key="top"
                    nodes={largeNodes}
                    edges={routedEdges}
                    name="root"
                    options={options}
                    onSelectNode={onSelectNode}
                    onExpandToggleNode={onExpandToggleNode}
                    targetArea={targetSize}
                    targetOffset={zeroPoint}
                    onNodesPositioned={onNodesMoved}
                    renderNode={renderNode}
                />
                <Edges key="edges" name="root" edges={posEdges} nodes={posNodesDict} options={options} />
            </SvgContainer>
        </div>
    );
};
