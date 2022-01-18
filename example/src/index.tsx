import {
    Box,
    ChakraProvider,
    Flex,
    Heading,
    List,
    ListItem,
    Link,
    theme,
    Center,
    FormControl,
    FormLabel,
    Switch,
} from "@chakra-ui/react";
import { GraphProps } from "@diagrams/graph";
import { mapValues } from "lodash";
import * as React from "react";
import { FC, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Link as RouterLink, Route, Routes } from "react-router-dom";
import { DemoGraphLevel2, DemoGraphLevel3, DemoGraphSimple } from "./demo-graph2D";

const Hello: FC = () => (
    <Center height="100%">
        <Center h={50} fontWeight="bold" fontSize="lg" w="auto" p={10} bg="#a0a0ff">
            <h2>Hello, select a demo graph on the left...</h2>
        </Center>
    </Center>
);
type NoEmpty<T> = T extends null | undefined ? never : T;

type GraphPropsOptionType = NoEmpty<GraphProps["options"]>;

const opts: Record<keyof GraphPropsOptionType, string> = {
    debugMassNode: "Mass of Node",
    debugSpringLengths: "Spring Lengths",
    debugHierarchicalSprings: "Hidden Hierarchical Edges",
};

const AppA: FC = () => {
    const [options, setOptions] = useState<GraphProps["options"]>({});
    const demos = useMemo(
        () => [
            { name: "Simple Graph", path: "/dag2d", component: <DemoGraphSimple options={options} /> },
            { name: "2-Level Hierarchical Graph", path: "/dag2dl2", component: <DemoGraphLevel2 options={options} /> },
            { name: "3-Level Hierarchical Graph", path: "/dag2dl3", component: <DemoGraphLevel3 options={options} /> },
        ],
        [options]
    );
    return (
        <Box height="100vh" m={0} p={0} bg="#eee" textColor="white">
            <Flex as="header" width="100%" bg="#303030" justifyContent="space-between" height="40px">
                <Box flex="0 0 auto" ml={2}>
                    <Heading size="md">Graph 2D</Heading>
                </Box>
            </Flex>
            <Box height="calc( 100% - 40px)" width="calc( 100% - 2px)" m={0} p={0} position="relative">
                <Box bg="#303030" top="{0}" position="absolute" left={0} height="100%" width="300px">
                    {Object.values(
                        mapValues(opts, (v, k: keyof GraphPropsOptionType) => (
                            <FormControl display="flex" alignItems="center" m={2}>
                                <Switch
                                    id={k}
                                    flex="40px 0 0"
                                    isChecked={(options && options[k]) === true}
                                    onChange={(x) => setOptions((o) => ({ ...o, [k]: x.currentTarget.checked }))}
                                />
                                <FormLabel htmlFor={k} mb="0">
                                    {v}
                                </FormLabel>
                            </FormControl>
                        ))
                    )}
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
                    left="300px"
                    top="80px"
                    width="calc( 100% - 300px )"
                    height="calc( 100% - 80px )"
                >
                    <Routes>
                        {demos.map((d) => (
                            <Route key={d.path} path={d.path} element={d.component} />
                        ))}
                        <Route path="/" element={<Hello />} />
                    </Routes>
                </Box>
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
