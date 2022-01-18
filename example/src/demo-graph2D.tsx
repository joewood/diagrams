import { Box } from "@chakra-ui/react";
import { Graph, GraphProps, useNgraph } from "@diagrams/graph";
import * as React from "react";
import { FC, useState } from "react";
import { edges, nodesL3, nodesL2, nodesLeaf } from "./data";

export const DemoGraphSimple: FC<{ options: GraphProps["options"] }> = ({ options }) => {
    const graph = useNgraph(nodesLeaf, edges, null, { iterations: 500 });
    return (
        <Box width="100%" height="100%">
            <Graph key="graph" graph={graph} options={options} />;
        </Box>
    );
};

export const DemoGraphLevel2: FC<{ options: GraphProps["options"] }> = ({ options }) => {
    const [expanded, setExpanded] = useState<string[]>([]);
    const graph = useNgraph(nodesL2, edges, expanded, { iterations: 500 });
    const onSelectNode = React.useCallback((args: { name: string }) => {
        setExpanded((exp) => (exp.includes(args.name) ? exp.filter((e) => e !== args.name) : [...exp, args.name]));
    }, []);
    return (
        <Box width="100%" height="100%">
            <Graph graph={graph} onSelectNode={onSelectNode} options={options} />;
        </Box>
    );
};

export const DemoGraphLevel3: FC<{ options: GraphProps["options"] }> = ({ options }) => {
    const [expanded, setExpanded] = useState<string[]>([]);
    const graph = useNgraph(nodesL3, edges, expanded, { iterations: 500 });
    const onSelectNode = React.useCallback((args: { name: string }) => {
        setExpanded((exp) => (exp.includes(args.name) ? exp.filter((e) => e !== args.name) : [...exp, args.name]));
    }, []);
    return (
        <Box width="100%" height="100%">
            <Graph graph={graph} onSelectNode={onSelectNode} options={options} />;
        </Box>
    );
};
