import * as React from "react";
import { FC, useMemo } from "react";
import { Edges } from "./edges";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { GraphOptions, zeroPoint } from "./model";
import { SvgContainer } from "./svg-container";
import { useDimensions } from "./use-dimensions";
import { useDefaultOptions, useGraphResize, useScreenPositionTracker } from "./use-ngraph";

interface SimpleGraphProps
    extends Pick<Required<MiniGraphProps>, "onSelectNode" | "selectedNode" | "simpleNodes" | "simpleEdges"> {
    options?: GraphOptions;
}

export const SimpleGraph: FC<SimpleGraphProps> = ({
    simpleEdges,
    simpleNodes,
    onSelectNode,
    selectedNode,
    options: _options = {},
}) => {
    // useChanged("edges", edges);
    // useChanged("onSelectNode", nodes);
    // useChanged("_options", _options);

    const [ref, { size: targetSize }] = useDimensions<HTMLDivElement>();
    const defaultContainerSize = useMemo(
        () => ({ width: targetSize.width / 2, height: targetSize.height / 2 }),
        [targetSize.height, targetSize.width]
    );

    const [graphSize, onResizeGraph] = useGraphResize(undefined, defaultContainerSize,true);
    const options = useDefaultOptions(_options);
    const [, posSizeDict, onNodesPositioned] = useScreenPositionTracker([], "Simple");
    return (
        <div key="root" ref={ref} style={{ width: "100%", height: "100%", display: "block", overflow: "auto" }}>
            <SvgContainer key="svg" textSize={options.textSize} screenSize={graphSize ?? defaultContainerSize}>
                <MiniGraph
                    key="graph"
                    name="root"
                    simpleNodes={simpleNodes}
                    simpleEdges={simpleEdges}
                    onSelectNode={onSelectNode}
                    selectedNode={selectedNode}
                    onResizeNeeded={onResizeGraph}
                    screenSize={graphSize ?? defaultContainerSize}
                    screenPosition={zeroPoint}
                    onNodesPositioned={onNodesPositioned}
                    options={options}
                />
                <Edges key="edges" name="root" edges={simpleEdges} positionDict={posSizeDict} options={options} />
            </SvgContainer>
        </div>
    );
};
