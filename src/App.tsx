import * as React from "react";
import { CSSProperties } from "react";
import { Canvas } from "react-three-fiber";
import { Vector3 } from "three";
import { Text, CameraRig } from "simv-three-utils";

import styled, { createGlobalStyle } from "styled-components";

const Global = createGlobalStyle`
    html, body {
        margin:0;
        padding:0;
    }
`;

const Root = styled.div`
    margin: 0;
    padding: 0;
    overflow-y: hidden;
    & > header {
        height: 50px;
    }
    & .container {
        width: 100vw;
        position: absolute;
        top: 50px;
        height: calc(100vh - 50px);
        background-color: black;
        margin: 0;
        padding: 0;
    }
`;

const App: React.FC = () => {
    return (
        <Root>
            <Global></Global>
            <header>
                <div>DAG 3D Component</div>
            </header>
            <div className="container">
                <Canvas pixelRatio={window.devicePixelRatio}>
                    <CameraRig distance={10} targetPosition={new Vector3(0, 0, -2)} />
                    <pointLight position={[0, 0, -2]} />
                    <ambientLight args={[0x0a0a0ff, 0.9]} />
                    <Text position={new Vector3(0, 1, -1)} width={2} depth={1} color="#202050" text="Hello"></Text>
                    <Text position={new Vector3(0, 0, -1.5)} width={2.5} depth={3} color="#202050" text="Hello"></Text>
                    <Text position={new Vector3(0, -1, -2)} width={3} depth={5} color="#202050" text="Hello"></Text>
                </Canvas>
            </div>
        </Root>
    );
};

export default App;
