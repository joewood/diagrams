import React from 'react'
import { Canvas } from 'react-three-fiber'
import { Color } from "three"
import { Graph, useDag } from "./graph"

export const DemoGraph = () => {
    const height = 6;
    const width = 50;
    const vwapEngine = "VWAP Engine"
    const oms = "OMS"
    const market = "Exch Links"
    const trading = "Trading Sys"
    const prices = "MD Sys"
    const client = "Client"
    const clientSys = "Client Int"
    const graph = useDag([
        { name: "Config", width, height },
        { name: "Ref Data Svc", width, height },
        { name: "EOD Prices", width, height },
        { name: prices, width, height },
        { name: client, width, height },
        { name: clientSys, width, height },
        { name: vwapEngine, width, height },
        { name: oms, width, height },
        { name: market, width, height },
        { name: trading, width, height }
    ], [
        { from: "Config", to: vwapEngine },
        { from: client, to: clientSys },
        { from: clientSys, to: oms },
        { from: "Ref Data Svc", to: vwapEngine },
        { from: prices, to: vwapEngine },
        { from: "EOD Prices", to: vwapEngine },
        { from: vwapEngine, to: oms },
        { from: oms, to: market },
        { from: market, to: trading },
        { from: trading, to: clientSys }
    ],
        "RL");
    return (
        <Canvas pixelRatio={window.devicePixelRatio}>
            <ambientLight />
            <spotLight position={[10, -30, 10]} color={new Color("#4040ff")} rotation={[0.2, -0.2, 0]} />
            <spotLight position={[-10, -30, 10]} color={new Color("#90ff90")} rotation={[0.2, 0.2, 0]} />
            <Graph graph={graph} />
        </Canvas>
    )
}
