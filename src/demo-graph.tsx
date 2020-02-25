import React, { useCallback, useState } from "react";
import { Canvas } from "react-three-fiber";
import { Color } from "three";
import { useDag } from "./component/dagre-graph";
import { Graph } from "./component/graph";
import { useNgraph } from "./component/nlayout-graph";

const height = 12;
const width = 30;

const vwapEngine = "VWAP Engine";
const oms = "OMS";
const market = "Exch Links";
const trading = "Trading Sys";
const prices = "MD Sys";
const client = "Client";
const clientIn = "Client In";
const clientOut = "Client Out";

const nodes = [
    { name: "Ref Data Svc", width: width, height: height },
    { name: "EOD Prices", width, height },
    { name: prices, width, height },
    { name: clientIn, width, height },
    { name: vwapEngine, width: width, height: height },
    { name: oms, width: width, height: height },
    { name: market, width, height },
    { name: "Config", width, height },
    { name: trading, width, height },
    { name: clientOut, width, height }
];

const edges = [
    { from: clientIn, to: oms, weight: 2 },
    { from: "Ref Data Svc", to: vwapEngine },
    { from: "Config", to: vwapEngine, messages: 1, weight: 2 },
    { from: prices, to: vwapEngine, messages: 20, weight: 2 },
    { from: "EOD Prices", to: vwapEngine, messages: 5 },
    { from: "EOD Prices", to: trading, messages: 5 },
    { from: vwapEngine, to: oms, weight: 2 },
    { from: oms, to: vwapEngine },
    { from: oms, to: market },
    { from: oms, to: trading },
    { from: market, to: oms, weight: 2 },
    // { from: market, to: trading },
    { from: trading, to: clientOut }
];

export const DemoGraph = () => {
    const [selectedNode, setNode] = useState<string | null>(null);
    const graph = useNgraph(nodes, edges);
    // const graph = useDag(nodes, edges, "RL");
    const unselect = useCallback(
        p => {
            setNode(null);
        },
        [setNode]
    );
    return (
        <Canvas pixelRatio={window.devicePixelRatio} onClickCapture={unselect}>
            <ambientLight />
            <spotLight position={[6, 2, 15]} color={new Color("#fff")} intensity={0.8} />
            <spotLight position={[-6, -2, 15]} color={new Color("#fff")} intensity={0.6} />
            <Graph
                graph={graph}
                feed={{
                    to: clientIn,
                    messages: [
                        { messageKey: "A" },
                        { messageKey: "B" },
                        { messageKey: "C" },
                        { messageKey: "D" },
                        { messageKey: "E" }
                    ]
                }}
                selectedNode={selectedNode}
                onSelectNode={({ text }) => setNode(text)}
            />
        </Canvas>
    );
};
