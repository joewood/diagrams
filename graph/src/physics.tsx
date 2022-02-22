import {
    Box,
    FormControl,
    FormLabel,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
    Switch,
    Tooltip,
} from "@chakra-ui/react";
import { mapValues } from "lodash";
import * as React from "react";
import { FC, useCallback, useState } from "react";
import { GraphOptions, RequiredGraphOptions } from "./hooks/model";

export type NumericOpts =
    | "gravity"
    | "springCoefficient"
    | "springLength"
    | "dragCoefficient"
    | "theta"
    | "textSize"
    | "nodeMargin"
    | "titleHeight";
export type PhysicsSettingsBag = {
    [Property in keyof Pick<RequiredGraphOptions, NumericOpts>]: {
        name: string;
        description: string;
        default: RequiredGraphOptions[Property];
        minVal: RequiredGraphOptions[Property];
        maxVal: RequiredGraphOptions[Property];
    };
};

export function useGraphOptions() {
    const [options, setOptions] = useState<GraphOptions>({
        ...mapValues(physicsMeta, (k) => k.default),
        dimensions: 2,
        timeStep: 0.5,
        adaptiveTimeStepWeight: 0,
        debug: false,
    });
    return [options, setOptions] as [GraphOptions, typeof setOptions];
}
const opts: Record<keyof Pick<GraphOptions, "debugMassNode">, string> = {
    debugMassNode: "Mass of Node",
};

const physicsMeta: PhysicsSettingsBag = {
    gravity: {
        name: "Gravity - Coulomb's law coefficient",
        description:
            "It's used to repel nodes thus should be negative if you make it positive nodes start attract each other",
        minVal: -1500,
        maxVal: 0,
        default: -12,
    },
    springCoefficient: {
        name: "Hook's law coefficient",
        description: "1 - solid spring.",
        minVal: 0,
        maxVal: 1,
        default: 0.8,
    },
    springLength: {
        name: "Ideal length for links",
        description: "Ideal length for links (springs in physical model).",
        minVal: 2,
        maxVal: 500,
        default: 10,
    },
    theta: {
        name: "Theta coefficient from Barnes Hut simulation",
        description:
            "The closer it's to 1 the more nodes algorithm will have to go through. Setting it to one makes Barnes Hut simulation no different from brute-force forces calculation (each node is considered)",
        minVal: 0,
        maxVal: 1,
        default: 0.8,
    },
    dragCoefficient: {
        name: "Drag force coefficient",
        description:
            "Used to slow down system, thus should be less than 1. The closer it is to 0 the less tight system will be.",
        minVal: 0,
        maxVal: 1,
        default: 0.9,
    },
    textSize: {
        name: "Size of text",
        description: "Default font size",
        minVal: 1,
        maxVal: 20,
        default: 10,
    },
    nodeMargin: {
        name: "Node Margin",
        description: "Margin around nodes checking for collisions",
        minVal: 1,
        maxVal: 40,
        default: 10,
    },
    titleHeight: {
        name: "Title Bar Height",
        description: "Area at top of subgraph reserved for title",
        minVal: 1,
        maxVal: 100,
        default: 30,
    },
};

export const PhysicsSettings: FC<{ options: GraphOptions; updateOptions: (options: GraphOptions) => void }> = ({
    options,
    updateOptions,
}) => {
    const [showTooltip, setShowTooltip] = useState<string>();
    const setOptions = useCallback((o: GraphOptions) => updateOptions({ ...options, ...o }), [options, updateOptions]);

    return (
        <Box width="calc( 100% - 20px )" border="1px solid gray" ml={2} borderRadius={5}>
            {Object.values(
                mapValues(opts, (v, k: keyof GraphOptions) => (
                    <FormControl key={k} ml={2} mt={2} display="flex" alignItems="center" size="small">
                        <Switch
                            id={k}
                            size="sm"
                            flex="40px 0 0"
                            isChecked={(options && options[k]) === true}
                            onChange={(x) => setOptions({ [k]: x.currentTarget.checked })}
                        />
                        <FormLabel htmlFor={k} mb="0" size="sm">
                            {v}
                        </FormLabel>
                    </FormControl>
                ))
            )}
            {Object.values(
                mapValues(physicsMeta, (v, key: NumericOpts) => (
                    <FormControl
                        key={key}
                        display="flex"
                        flexDirection="column"
                        alignItems="left"
                        m={2}
                        size="sm"
                        pr={4}
                        width="100%"
                    >
                        <FormLabel htmlFor={key} mb="0">
                            {v.name}
                        </FormLabel>
                        <Slider
                            id={key}
                            value={options[key]}
                            min={v.minVal}
                            max={v.maxVal}
                            step={(v.maxVal - v.minVal) / 10}
                            onChange={(value) => setOptions({ [key]: value })}
                            onMouseEnter={() => setShowTooltip(key)}
                            onMouseLeave={() => setShowTooltip(undefined)}
                        >
                            <SliderTrack>
                                <SliderFilledTrack />
                            </SliderTrack>
                            <Tooltip
                                hasArrow
                                bg="teal.500"
                                color="white"
                                placement="top"
                                isOpen={showTooltip === key}
                                label={"value: " + Math.round((options[key] ?? 0) * 10) / 10}
                            >
                                <SliderThumb />
                            </Tooltip>
                        </Slider>
                    </FormControl>
                ))
            )}
        </Box>
    );
};
