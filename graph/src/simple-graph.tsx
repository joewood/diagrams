import * as React from "react";
import { FC } from "react";
import { Edges } from "./edges";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { GraphOptions, SimpleEdge, SimpleNode, zeroPoint } from "./model";
import { SvgContainer } from "./svg-container";
import { useDimensions } from "./use-dimensions";
import { useDefaultOptions, useEdges } from "./use-ngraph";

type ReuseMiniGraphProps = "onSelectNode" | "selectedNode";

interface SimpleGraphProps extends Pick<Required<MiniGraphProps>, ReuseMiniGraphProps> {
    nodes: SimpleNode[];
    edges: SimpleEdge[];
    options?: GraphOptions;
}

export const SimpleGraph: FC<SimpleGraphProps> = ({
    edges,
    nodes,
    onSelectNode,
    selectedNode,
    options: _options = {},
}) => {
    // useChanged("edges", edges);
    // useChanged("onSelectNode", nodes);
    // useChanged("_options", _options);

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
                    selectedNode={selectedNode}
                    targetArea={targetArea}
                    targetOffset={zeroPoint}
                    onNodesPositioned={onNodesMoved}
                    options={options}
                />
                <Edges key="edges" name="root" edges={posEdges} nodes={posNodes} options={options} />
            </SvgContainer>
        </div>
    );
};
