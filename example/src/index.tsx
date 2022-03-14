import {
    Box,
    Button,
    Center,
    ChakraProvider,
    Flex,
    Heading,
    theme,
    useColorMode,
    useStyleConfig,
} from "@chakra-ui/react";
import { GraphOptions, PhysicsSettings, useGraphOptions } from "@diagrams/graph";
import { SideBar } from "@diagrams/sidebar";
import * as React from "react";
import { ElementType, FC, useMemo } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Link as RouterLink, Route, Routes, useLocation } from "react-router-dom";
import { DemoGraphSimple } from "./demo-simple";
import { DemoGraphSimpleBusy } from "./demo-simple-busy";
import { DemoGraphThreeDeep } from "./demo-three-deep";
import { DemoGraphTwoDeep } from "./demo-two-deep";
import { DemoGraphTwoDeepBasic } from "./demo-two-deep-basic";

const Hello: FC = () => (
    <Center height="100%">
        <Center h={50} fontWeight="bold" fontSize="lg" w="auto" p={10} bg="#a0a0ff">
            <h2>Hello, select a demo graph on the left...</h2>
        </Center>
    </Center>
);

const GraphDemo: FC = () => (
    <Center p={10}>
        <Box>
            <h2>Force Based Layout</h2>
            <p>The demos in the section contain simple Forced Based Graph Layout</p>
        </Box>
    </Center>
);

const navWidth = 320;
const navHeight = 40;

function useDemo(options: GraphOptions, Demo: ElementType<{ options: GraphOptions }>, name: string) {
    return useMemo(
        () => ({
            name,
            component: <Demo options={options} />,
            pathPart: encodeURIComponent(name),
        }),
        [Demo, name, options]
    );
}

const AppA: FC = () => {
    const [options, setGraphOptions] = useGraphOptions();
    const location = useLocation();
    const simpleGraphs = [
        useDemo(options, DemoGraphSimple, "Simple Graph"),
        useDemo(options, DemoGraphSimpleBusy, "Busy Graph"),
    ];
    const expandableGraphs = [
        useDemo(options, DemoGraphTwoDeepBasic, "Two Deep Basic"),
        useDemo(options, DemoGraphTwoDeep, "Two Deep"),
        useDemo(options, DemoGraphThreeDeep, "Three Deep"),
    ];
    const { colorMode, toggleColorMode } = useColorMode();
    const style = useStyleConfig("Container");
    return (
        <Box height="100vh" width="100vw" m={0} p={0} position="relative">
            <Flex as="header" width="100%" sx={style} justifyContent="space-between" height={`${navHeight}px`}>
                <Box flex="0 0 auto" ml={2}>
                    <Heading size="md">@diagrams/graph</Heading>
                </Box>
                <Button flex="0 0 auto" onClick={toggleColorMode}>{`${
                    colorMode === "dark" ? "Light" : "Dark"
                } Mode`}</Button>
            </Flex>
            <Box pos="absolute" top={`${navHeight}px`} left={0} height={`calc( 100% - ${navHeight}px )`}>
                <SideBar
                    currentPath={location.pathname}
                    sx={{ label: { fontSize: "0.8rem" } }}
                    pages={[
                        {
                            name: "Simple Graphs",
                            pathPart: "graph",
                            subPages: simpleGraphs,
                        },
                        {
                            name: "Expandable Graphs",
                            pathPart: "expandable",
                            subPages: expandableGraphs,
                        },
                    ]}
                    options={{
                        drawerWidth: navWidth,
                        linkElement: RouterLink,
                    }}
                >
                    <PhysicsSettings options={options} updateOptions={setGraphOptions} />
                </SideBar>
            </Box>
            <Box
                as="main"
                position="absolute"
                left={`${navWidth}px`}
                top={`${navHeight}px`}
                width={`calc( 100vw - ${navWidth}px )`}
                height={`calc( 100vh - ${navHeight}px )`}
            >
                <Routes>
                    {simpleGraphs.map((d) => (
                        <Route key={d.pathPart} path={"/graph/" + d.pathPart} element={d.component} />
                    ))}
                    {expandableGraphs.map((d) => (
                        <Route key={d.pathPart} path={"/expandable/" + d.pathPart} element={d.component} />
                    ))}

                    <Route path="/" element={<Hello />} />
                    <Route path="/graph" element={<GraphDemo />} />
                </Routes>
            </Box>
        </Box>
    );
};

export const App: FC = () => (
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
