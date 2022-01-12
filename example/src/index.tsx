import { Box, ChakraProvider, Flex, Heading, List, ListItem, Link, theme } from "@chakra-ui/react";
import * as React from "react";
import { FC } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Link as RouterLink, Route, Routes } from "react-router-dom";
import { DemoGraph2D } from "./demo-graph2D";

const AppA: FC = () => {
    return (
        <Box height="100vh" m={0} p={0} bg="#eee" textColor="white">
            <Flex as="header" width="100%" bg="#303030" justifyContent="space-between" height="40px">
                <Box flex="0 0 auto" ml={2}>
                    <Heading size="md">Graph 2D</Heading>
                </Box>
                {/* <button style={buttonStyle} onClick={pump1}>
                    Pump Producer #1
                </button>
                <button style={buttonStyle} onClick={pump2}>
                    Pump Producer #2
                </button>
                <button style={buttonStyle} onClick={pump3}>
                    Pump Producer #3
                </button> */}
                {/* <FormControl flex="0 0 50px" display="flex" alignItems="center" mr={2}>
                    <FormLabel htmlFor="email-alerts">Orbit</FormLabel>
                    <Switch id="email-alerts" onChange={orbitChange} />
                </FormControl> */}
            </Flex>
            <Box  height="calc( 100% - 40px)" width="calc( 100% - 2px)" m={0} p={0} position="relative" >
                <Box bg="#303030" top="{0}" position="absolute" left={0} height="100%" width="300px" >
                    <List m={5}>
                        <ListItem><Link as={RouterLink} fontWeight="bold" to="/dag2d">Hierarchical Graph</Link></ListItem>
                    </List>
                </Box>
                <Box as="main" position="absolute" left="300px" top="80px" width="calc( 100% - 300px )" height="calc(100% - 80px)">
                    <Routes>
                        <Route path="dag2d" element={<DemoGraph2D />} />
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
