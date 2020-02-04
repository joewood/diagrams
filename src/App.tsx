import React from 'react';
import './App.css';
import { DemoGraph } from "./demo-graph"

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        DAG 3D Component
      </header>
      <DemoGraph />
    </div>
  );
}

export default App;
