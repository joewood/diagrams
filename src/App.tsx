import React, { useState, useCallback, CSSProperties } from "react";
import "./App.css";
import { DemoGraph } from "./demo-graph";
import { RecordStream } from "./component/record-stream";

const height = 20;
const width = 20;
const depth = 20;

const producer1 = "Producer #1";
const producer2 = "Producer #2";
const producer3 = "Producer #3";
const messageQueue = "Message Queue";
const consumer1 = "Consumer #1";
const consumer2 = "Consumer #2";
const consumer3 = "Consumer #3";
const consumer4 = "Consumer #4";
const messageQueue2 = "Out Queue";
// const client = "Client";

const commonNode = { width, height, depth };
const nodes = [
    { name: producer1, ...commonNode, x: 100 },
    { name: producer2, ...commonNode, x: 100 },
    { name: producer3, ...commonNode, x: 100 },
    { name: messageQueue, ...commonNode },
    { name: consumer1, ...commonNode, x: -100 },
    { name: consumer2, ...commonNode, x: -100 },
    { name: consumer3, ...commonNode, x: -100 },
    { name: consumer4, ...commonNode, x: -100 },
    { name: messageQueue2, ...commonNode, y: -300 }
];

const edges = [
    { from: producer1, to: messageQueue, weight: 2 },
    { from: producer2, to: messageQueue, weight: 2 },
    { from: producer3, to: messageQueue, weight: 2 },
    { from: messageQueue, to: consumer1, weight: 2 },
    { from: messageQueue, to: consumer2, weight: 2 },
    { from: messageQueue, to: consumer3, weight: 2 },
    { from: messageQueue, to: consumer4, weight: 2 },
    { from: consumer3, to: messageQueue2, weight: 2 }
];
const buttonStyle = {
    backgroundColor: "black",
    color: "#bbb",
    height: 25,
    fontWeight: "bold",
    margin: 5
} as CSSProperties;

const App: React.FC = () => {
    const [pump, setPump] = useState<{ id: string; v: string[] } | null>(null);
    const pump1 = useCallback(() => setPump({ id: producer1, v: ["1X"] }), [setPump]);
    const pump2 = useCallback(() => setPump({ id: producer2, v: ["2X"] }), [setPump]);
    const pump3 = useCallback(() => setPump({ id: producer3, v: ["3X"] }), [setPump]);

    return (
        <div className="App">
            <header className="App-header">
                <div>DAG 3D Component</div>
                <button style={buttonStyle} onClick={pump1}>
                    Pump Producer #1
                </button>
                <button style={buttonStyle} onClick={pump2}>
                    Pump Producer #2
                </button>
                <button style={buttonStyle} onClick={pump3}>
                    Pump Producer #3
                </button>
                <div>
                    <RecordStream filename="dag3d" />
                </div>
            </header>
            <DemoGraph
                pumpProducer={(pump && pump.id) || null}
                pumpValue={pump && pump.v}
                nodes={nodes}
                edges={edges}
            />
        </div>
    );
};

export default App;
