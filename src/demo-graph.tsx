import React, { useCallback, useState, useMemo, useEffect } from "react";
import { Canvas } from "react-three-fiber";
import { Color } from "three";
import { useDag } from "./graph/dagre-graph";
import { Graph } from "./graph/graph";
import { useNgraph } from "./graph/nlayout-graph";

interface DemoGraphProps {
    nodes: { name: string; width: number; height: number; depth: number; x?: number; y?: number; z?: number }[];
    edges: { from: string; to: string; weight?: number }[];
    pumpProducer: string | null;
    pumpValue: string[] | null;
}

export const DemoGraph = ({ pumpProducer, pumpValue, nodes, edges }: DemoGraphProps) => {
    const [selectedNode, setNode] = useState<string | null>(null);
    const graph = useNgraph(nodes, edges);
    // const graph = useDag(nodes, edges, "RL");
    const messages = useMemo(
        () => (pumpValue && pumpProducer && pumpValue.map((v, i) => ({ messageKey: v }))) || null,
        [pumpValue, pumpProducer]
    );
    const unselect = useCallback(
        p => {
            setNode(null);
        },
        [setNode]
    );
    return (
        <Canvas pixelRatio={window.devicePixelRatio} onClickCapture={unselect}>
            <ambientLight args={[0x0ffffff, 0.9]} />
            <directionalLight position={[6, 2, 15]} args={[0x0ffaaaa, 0.7]} />
            <directionalLight position={[-6, 2, 15]} args={[0x0aaffaa, 0.7]} />
            <directionalLight position={[-6, 2, -25]} args={[0x0aaaaff, 0.7]} />
            <directionalLight position={[6, 2, -25]} args={[0x0ffaaff, 0.7]} />
            <Graph
                graph={graph}
                feed={[{ to: pumpProducer, messages: messages || [] }]}
                selectedNode={selectedNode}
                onSelectNode={({ text }) => setNode(text)}
            />
        </Canvas>
    );
};
