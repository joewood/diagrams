import {
    Box,
    Center,
    ChakraProvider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Link,
    List,
    ListItem,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
    Switch,
    theme,
    Tooltip,
} from "@chakra-ui/react";
import { RequiredGraphOptions, GraphOptions } from "@diagrams/graph";
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

type NumericOpts = "gravity" | "springCoefficient" | "springLength" | "dragCoefficient" | "theta" | "textSize";

const opts: Record<keyof Pick<GraphOptions, "debugMassNode">, string> = {
    debugMassNode: "Mass of Node",
    // debugSpringLengths: "Spring Lengths",
    // debugHierarchicalSprings: "Hidden Hierarchical Edges",
};

const navWidth = "300px";
const navHeight = "40px";

// type GraphOpts = Omit<GraphOptions, "physics" | "textSize">;
// type PhysicsSettings = Required<UseNGraphOptions>["physics"] & { textSize: number };
type PhysicsSettingsBag = {
    [Property in keyof Pick<RequiredGraphOptions, NumericOpts>]: {
        name: string;
        description: string;
        default: RequiredGraphOptions[Property];
        minVal: RequiredGraphOptions[Property];
        maxVal: RequiredGraphOptions[Property];
    };
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
};

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
        () => [
            {
                name: "Simple Graph",
                path: "/dag2d",
                component: <DemoGraphSimple options={options} />,
            },
            {
                name: "2-Level Hierarchical Graph",
                path: "/dag2dl2",
                component: <DemoGraphTwoDeep options={options} />,
            },
            {
                name: "3-Level Hierarchical Graph",
                path: "/dag2dl3",
                component: <DemoGraphThreeDeep options={options} />,
            },
        ],
        [options]
    );
    return (
        <Box height="100vh" m={0} p={0} bg="#eee" textColor="black" position="relative">
            <Flex id="_header" as="header" width="100%" bg="#e0e0f0" justifyContent="space-between" height={navHeight}>
                <Box flex="0 0 auto" ml={2}>
                    <Heading size="md">Graph 2D</Heading>
                </Box>
            </Flex>
            <Box
                width={navWidth}
                bg="#e0e0e0"
                minHeight={`calc( 100% - ${navHeight} )`}
                as="nav"
                m={0}
                p={0}
                pt={2}
                position="absolute"
                top={navHeight}
                sx={{ label: { fontSize: "0.8rem" } }}
            >
                {Object.values(
                    mapValues(opts, (v, k: keyof GraphOptions) => (
                        <FormControl key={k} display="flex" alignItems="center" m={2} size="small">
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
                <Box mt={8}>
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
                <List m={5} sx={{ "& > li": { fontWeight: "bold", mb: 3, p: 2, _hover: { bg: "#404040" } } }}>
                    {demos.map((d) => (
                        <ListItem key={d.path}>
                            <Link as={RouterLink} to={d.path}>
                                {d.name}
                            </Link>
                        </ListItem>
                    ))}
                </List>
            </Box>
            <Box
                as="main"
                position="absolute"
                left={navWidth}
                top={navHeight}
                p={0}
                m={0}
                width={`calc( 100% - ${navWidth} )`}
                height={`calc( 100% - ${navHeight} )`}
            >
                <Routes>
                    {demos.map((d) => (
                        <Route key={d.path} path={d.path} element={d.component} />
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
