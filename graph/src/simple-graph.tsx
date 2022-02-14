import * as React from "react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Edges } from "./edges";
import { MiniGraph, MiniGraphProps } from "./mini-graph";
import { GraphOptions, Size, zeroPoint } from "./model";
import { SvgContainer } from "./svg-container";
import { useDimensions } from "./use-dimensions";
import { useDefaultOptions, useBubbledPositions } from "./use-ngraph";

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

    const [ref, { size: targetSize }] = useDimensions<HTMLDivElement>();
    const defaultContainerSize = useMemo(
        () => (targetSize && { width: targetSize.width / 2, height: targetSize.height / 2 }) || undefined,
        [targetSize]
    );
    // Resize Demand - change the state
    const [graphSize, setGraphSize] = useState<Size|undefined>();
    const onResizeNeeded = useCallback<MiniGraphProps["onResizeNeeded"]>((_name, overlapping, shrinking) => {
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
    const options = useDefaultOptions(_options);
    const [edgeNodePositions, onBubblePositions] = useBubbledPositions();
    return (
        <div key="root" ref={ref} style={{ width: "100%", height: "100%", display: "block", overflow: "auto" }}>
            <SvgContainer key="svg" textSize={options.textSize} screenSize={graphSize}>
                {graphSize && (
                    <MiniGraph
                        key="graph"
                        name="root"
                        simpleNodes={simpleNodes}
                        simpleEdges={simpleEdges}
                        onSelectNode={onSelectNode}
                        selectedNode={selectedNode}
                        onResizeNeeded={onResizeNeeded}
                        expanded={[]}
                        level={1}
                        screenSize={graphSize}
                        screenPosition={zeroPoint}
                        onBubblePositions={onBubblePositions}
                        options={options}
                    />
                )}
                <Edges key="edges" name="root" edges={simpleEdges} positionDict={edgeNodePositions} options={options} />
            </SvgContainer>
        </div>
    );
};
