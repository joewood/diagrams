import React from 'react';
import logo from './logo.svg';
import './App.css';
import Stuff from "./graph"

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        DAG Component
      </header>
      <Stuff />
    </div>
  );
}

export default App;
