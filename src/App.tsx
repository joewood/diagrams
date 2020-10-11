import * as React from "react";
import { useState, useCallback, CSSProperties, useRef } from "react";
import "./App.css";
import { Canvas } from "react-three-fiber";
import { DirectionalLight, Vector3, DirectionalLightHelper, Mesh } from "three";
import { Text } from "three-utils";
// import { MeshNode } from "./three-utils/text";

const height = 15;
const width = 20;
const depth = 20;

const buttonStyle = {
    backgroundColor: "black",
    color: "#bbb",
    height: 25,
    fontWeight: "bold",
    margin: 5,
} as CSSProperties;

const App: React.FC = () => {
    // const [selectedNode, setNode] = useState<string | null>(null);
    // const onSelectNode = useCallback(
    //     ({ name, mesh }: { name: string; mesh: Mesh | null }) => {
    //         setNode(name);
    //     },
    //     [setNode]
    // );

    // const unselect = useCallback((p) => setNode(null), [setNode]);

    return (
        <div className="App">
            <header className="App-header">
                <div>DAG 3D Component</div>
            </header>
            <Canvas pixelRatio={window.devicePixelRatio}>
                <ambientLight args={[0x0ffffff, 1.9]} />
                <spotLight intensity={1} position={[10, 3, 5]} args={[0x0ffaaaa, 0.9]} />
                <spotLight intensity={1} position={[-10, 0, 5]} args={[0x0aaffaa, 0.9]} />
                <spotLight intensity={1} position={[-10, 1, -15]} args={[0x0aaaaff, 0.7]} />
                <spotLight position={[10, 0, -15]} args={[0x0ffaaff, 0.7]} />
                <Text height={10} width={200} position={new Vector3(0, 0, 0)} depth={10} text="Hello"></Text>
            </Canvas>
        </div>
    );
};

export default App;
