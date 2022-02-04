import * as React from "react";
import { FC } from "react";
import { Edges } from "./edges";
import { MiniGraph, useChanged, useEdges } from "./mini-graph";
import { GraphOptions, SimpleEdge, SimpleNode, zeroPoint } from "./model";
import { SvgContainer } from "./svg-container";
import { useDimensions } from "./use-dimensions";
import { useDefaultOptions } from "./use-ngraph";

interface SimpleGraphProps {
    nodes: SimpleNode[];
    edges: SimpleEdge[];
    onSelectNode?: (args: { name: string }) => void;
    selectedNode?: string | null;
    options?: GraphOptions;
}

export const SimpleGraph: FC<SimpleGraphProps> = ({ edges, nodes, onSelectNode, options: _options = {} }) => {
    useChanged("edges", edges);
    useChanged("onSelectNode", nodes);
    useChanged("_options", _options);

    const [ref, { size: targetArea }] = useDimensions<HTMLDivElement>();
    const options = useDefaultOptions(_options);
    const [posNodes, posEdges, onNodesMoved] = useEdges();
    return (
        <div key="root" ref={ref} style={{ width: "100%", height: "100%", display: "block" }}>
            <SvgContainer key="svg" textSize={options.textSize}>
                <MiniGraph
                    key="graph"
                    name="root"
                    nodes={nodes}
                    edges={edges}
                    onSelectNode={onSelectNode}
                    targetArea={targetArea}
                    targetOffset={zeroPoint}
                    onNodesPositioned={onNodesMoved}
                    options={options}
                />
                <Edges
                    key="edges"
                    name="root"
                    edges={posEdges}
                    nodes={posNodes}
                    targetSize={targetArea}
                    targetOffset={zeroPoint}
                    options={options}
                />
            </SvgContainer>
        </div>
    );
};
