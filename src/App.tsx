import React from "react";
import "./App.css";
import { DemoGraph } from "./demo-graph";
import { RecordStream } from "./component/record-stream";

const App: React.FC = () => {
    return (
        <div className="App">
            <header className="App-header">
                <div>DAG 3D Component</div>
                <div>
                    <RecordStream filename="dag3d" />
                </div>
            </header>
            <DemoGraph />
        </div>
    );
};

export default App;
