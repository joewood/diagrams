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
import { GraphOptions, NumericOpts, physicsMeta } from "./model";

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
