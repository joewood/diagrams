import { keyBy } from "lodash";
import * as React from "react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Edges } from "./components/edges";
import { MiniGraph, MiniGraphProps } from "./components/mini-graph";
import { SvgContainer } from "./components/svg-container";
import { useDefaultNodes } from "./hooks/dynamic-nodes";
import { GraphOptions, SimpleEdge, Size, zeroPoint } from "./hooks/model";
import { useBubbledPositions, useDefaultOptions } from "./hooks/use-ngraph";
import { useDimensions } from "./use-dimensions";

interface SimpleGraphProps extends Pick<Required<MiniGraphProps>, "onSelectNode" | "selectedNodes" | "simpleNodes"> {
    simpleEdges: SimpleEdge[];
    options?: GraphOptions;
}

export const SimpleGraph: FC<SimpleGraphProps> = ({
    simpleEdges,
    simpleNodes,
    onSelectNode,
    selectedNodes,
    options: _options = {},
}) => {
    const [ref, { size: targetSize }] = useDimensions<HTMLDivElement>();
    const defaultContainerSize = useMemo(
        () => (targetSize && { width: targetSize.width / 2, height: targetSize.height / 2 }) || undefined,
        [targetSize]
    );
    const ignoreParent = useMemo(() => simpleNodes.map((p) => ({ ...p, parent: null })), [simpleNodes]);
    const defaultSimpleNodes = useDefaultNodes(ignoreParent);
    const nodesDict = useMemo(() => keyBy(defaultSimpleNodes, (n) => n.name), [defaultSimpleNodes]);
    // Resize Demand - change the state
    const [graphSize, setGraphSize] = useState<Size | undefined>();
    const onResizeNeeded = useCallback<MiniGraphProps["onResizeNode"]>((_name, size) => {
        setGraphSize(size);
    }, []);
    useEffect(() => {
        setGraphSize((oldGraphSize) => (!oldGraphSize ? defaultContainerSize : oldGraphSize));
    }, [defaultContainerSize]);
    const options = useDefaultOptions(_options);
    const [edgeNodePositions, onBubblePositions] = useBubbledPositions();
    return (
        <div key="root" ref={ref} style={{ width: "100%", height: "100%", display: "block", overflow: "auto" }}>
            <SvgContainer key="svg" nodeMargin={options.nodeMargin} screenSize={graphSize}>
                {graphSize && (
                    <MiniGraph
                        key="graph"
                        name="root"
                        simpleNodes={defaultSimpleNodes}
                        localSimpleEdges={simpleEdges}
                        allRoutedSimpleEdges={simpleEdges}
                        onSelectNode={onSelectNode}
                        selectedNodes={selectedNodes ? selectedNodes : null}
                        onResizeNode={onResizeNeeded}
                        expanded={[]}
                        screenSize={graphSize}
                        screenPosition={zeroPoint}
                        onBubblePositions={onBubblePositions}
                        options={options}
                    />
                )}
                <Edges
                    key="edges"
                    name="root"
                    edges={simpleEdges}
                    positionDict={edgeNodePositions}
                    nodesDict={nodesDict}
                    options={options}
                />
            </SvgContainer>
        </div>
    );
};
