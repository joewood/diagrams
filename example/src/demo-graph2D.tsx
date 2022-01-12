import { Box } from "@chakra-ui/react";
import { Graph, useNgraph } from "@diagrams/graph";
import * as React from "react";
import { FC, useState } from "react";
import { edges, nodes } from "./data";

export const DemoGraph2D: FC<{}> = ({}) => {
    const [expanded, setExpanded] = useState<string[]>([]);
    const graph = useNgraph(nodes, edges, { expanded, iterations: 500 });
    const onSelectNode = React.useCallback(
        (args: { name: string }) => {
            setExpanded((exp) => (exp.includes(args.name) ? exp.filter((e) => e !== args.name) : [...exp, args.name]));
        },
        []
    );
    return (
        <Box width="100%" height="100%" >
            <Graph key="graph" graph={graph} onSelectNode={onSelectNode} />;
        </Box>
    );
};
