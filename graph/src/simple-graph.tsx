import * as React from "react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Edges } from "./components/edges";
import { MiniGraph, MiniGraphProps } from "./components/mini-graph";
import { GraphOptions, Size, zeroPoint } from "./hooks/model";
import { SvgContainer } from "./components/svg-container";
import { useDimensions } from "./use-dimensions";
import { useDefaultOptions, useBubbledPositions } from "./hooks/use-ngraph";

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
    const [graphSize, setGraphSize] = useState<Size | undefined>();
    const onResizeNeeded = useCallback<MiniGraphProps["onResizeNeeded"]>(
        (_name, { overlappingX, overlappingY, shrinkingX, shrinkingY, suggestedSize }) => {
            setGraphSize(
                (existingSize) =>
                    (existingSize && {
                        width: suggestedSize?.width ?? existingSize.width * (overlappingX ? 1.1 : shrinkingX ? 0.9 : 1),
                        height:
                            suggestedSize?.height ?? existingSize.height * (overlappingY ? 1.1 : shrinkingY ? 0.9 : 1),
                    }) ||
                    undefined
            );
        },
        []
    );
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
