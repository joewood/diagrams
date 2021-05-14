import { RouteComponentProps } from "@reach/router";
import * as React from "react";
import { FC } from "react";
import { Canvas } from "react-three-fiber";
import { CameraRig, Text } from "simv-three-utils";
import { Vector3 } from "three";

interface QuestionProps {
    questionText: string;
}
const Question: FC<QuestionProps> = ({ questionText }) => {
    return (
        <Text
            position={new Vector3(0, 50, -100)}
            width={150}
            depth={0.1}
            height={40}
            fontSize={8}
            backgroundColor="#333"
            text={questionText}
        ></Text>
    );
};

interface OptionProps {
    optionNumber: number;
    optionText: string;
    optionHeight?: number;
    optionMargin?: number;
}

const Option: FC<OptionProps> = ({ optionNumber, optionHeight = 20, optionMargin = 5, optionText }) => {
    const optionColors = ["#f33", "#ff3", "#3ff", "#33f"];
    return (
        <Text
            position={new Vector3(0, 0 + -1.0 * ((optionNumber - 1.5) * (optionHeight + optionMargin)), -100)}
            width={100}
            depth={0.1}
            height={optionHeight}
            fontSize={10}
            color="#000"
            backgroundColor={optionColors[optionNumber]}
            text={optionText}
        ></Text>
    );
};

export const TextDemo: FC<RouteComponentProps> = () => (
    <Canvas pixelRatio={window.devicePixelRatio}>
        <CameraRig distance={70} targetPosition={new Vector3(0, 0, -45)} rotate={0} />
        <pointLight position={[0, 20, -40]} />
        <pointLight position={[0, 0, -40]} />
        <pointLight position={[0, -20, -40]} />
        <ambientLight args={[0x0a0a0ff, 0.9]} />
        <Question questionText="What color is it?" />
        <Option optionNumber={1} optionText="It is blue" />
        <Option optionNumber={2} optionText="It is yellow" />
        <Option optionNumber={3} optionText="It is pink" />
        <Option optionNumber={4} optionText="It is red" />
    </Canvas>
);
