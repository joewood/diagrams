import {
    Box,
    Center,
    ChakraProvider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
    Switch,
    theme,
    Tooltip,
} from "@chakra-ui/react";
import { GraphOptions, NumericOpts, physicsMeta } from "@diagrams/graph";
import { SideBar } from "@diagrams/sidebar";
import { mapValues } from "lodash";
import * as React from "react";
import { FC, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Link as RouterLink, Route, Routes } from "react-router-dom";
import { DemoGraphSimple } from "./demo-simple";
import { DemoGraphThreeDeep } from "./demo-three-deep";
import { DemoGraphTwoDeep } from "./demo-two-deep";

const Hello: FC = () => (
    <Center height="100%">
        <Center h={50} fontWeight="bold" fontSize="lg" w="auto" p={10} bg="#a0a0ff">
            <h2>Hello, select a demo graph on the left...</h2>
        </Center>
    </Center>
);
// type NoEmpty<T> = T extends null | undefined ? never : T;
// type GraphPropsOptionType = NoEmpty<Omit<GraphOptions, "defaultSize" | "textSize">>;

const opts: Record<keyof Pick<GraphOptions, "debugMassNode">, string> = {
    debugMassNode: "Mass of Node",
    // debugSpringLengths: "Spring Lengths",
    // debugHierarchicalSprings: "Hidden Hierarchical Edges",
};

const navWidth = 320;
const navHeight = 40;

const AppA: FC = () => {
    const [options, setOptions] = useState<GraphOptions>({
        ...mapValues(physicsMeta, (k) => k.default),
        dimensions: 2,
        timeStep: 0.5,
        adaptiveTimeStepWeight: 0,
        debug: false,
    });
    const [showTooltip, setShowTooltip] = useState<string>();

    const demos = useMemo(
        () =>
            [
                {
                    name: "Simple Graph",
                    component: <DemoGraphSimple options={options} />,
                },
                {
                    name: "2-Level Hierarchical Graph",
                    component: <DemoGraphTwoDeep options={options} />,
                },
                {
                    name: "3-Level Hierarchical Graph",
                    component: <DemoGraphThreeDeep options={options} />,
                },
            ].map((o) => ({ ...o, path: encodeURIComponent(o.name) })),
        [options]
    );
    return (
        <Box height="100vh" m={0} p={0} bg="#eee" textColor="black" position="relative">
            <Flex
                id="_header"
                as="header"
                width="100%"
                bg="#e0e0f0"
                justifyContent="space-between"
                height={`${navHeight}px`}
            >
                <Box flex="0 0 auto" ml={2}>
                    <Heading size="md">@diagrams/graph</Heading>
                </Box>
            </Flex>
            <SideBar
                sx={{ label: { fontSize: "0.8rem" } }}
                pages={[
                    {
                        name: "Graph Demos",
                        pathPart: "graph",
                        subPages: demos.map((d) => ({
                            pathPart: d.path,
                            name: d.name,
                            subPages: [],
                        })),
                    },
                ]}
                options={{
                    topOffset: navHeight,
                    drawerWidth: navWidth,
                    linkElement: RouterLink,
                    backgroundColor: "#e0e0f0",
                }}
            >
                <Box width="calc( 100% - 20px )" border="1px solid gray" ml={2} borderRadius={5}>
                    {Object.values(
                        mapValues(opts, (v, k: keyof GraphOptions) => (
                            <FormControl key={k} ml={2} mt={2} display="flex" alignItems="center" size="small">
                                <Switch
                                    id={k}
                                    size="sm"
                                    flex="40px 0 0"
                                    isChecked={(options && options[k]) === true}
                                    onChange={(x) => setOptions((o) => ({ ...o, [k]: x.currentTarget.checked }))}
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
                                    onChange={(value) => setOptions((state) => ({ ...state, [key]: value }))}
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
            </SideBar>

            <Box
                as="main"
                position="absolute"
                left={`${navWidth}px`}
                top={`${navHeight}px`}
                p={0}
                m={0}
                width={`calc( 100vw - ${navWidth}px )`}
                height={`calc( 100vh - ${navHeight}px )`}
            >
                <Routes>
                    {demos.map((d) => (
                        <Route key={d.path} path={"/graph/" + d.path} element={d.component} />
                    ))}
                    <Route path="/" element={<Hello />} />
                </Routes>
            </Box>
        </Box>
    );
};

export const App: FC<{}> = ({}) => (
    <ChakraProvider theme={theme}>
        <AppA />
    </ChakraProvider>
);

ReactDOM.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>,
    document.getElementById("root")
);
