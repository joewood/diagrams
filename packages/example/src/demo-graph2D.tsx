import { Box } from "@chakra-ui/react";
import { Graph2, useNgraph2 } from "@diagrams/graph";
import * as React from "react";
import { FC, useState } from "react";
import { edges, nodes } from "./data";

interface DemoGraphProps {
    // nodes: GraphNode[];
    // edges: GraphEdge[];
    // pumpProducer: string | null;
    // pumpValue: string[] | null;
    // orbit: boolean;
}

export const DemoGraph2D: FC<{}> = ({}) => {
    const [expanded, setExpanded] = useState<string[]>([]);
    const graph = useNgraph2(nodes, edges, { expanded, iterations: 500 });
    const onSelectNode = React.useCallback(
        (args: { name: string }) => {
            setExpanded((exp) => (exp.includes(args.name) ? exp.filter((e) => e !== args.name) : [...exp, args.name]));
        },
        []
    );
    return (
        <Box width="100%" height="100%" >
            <Graph2 key="graph" graph={graph} onSelectNode={onSelectNode} />;
        </Box>
    );
};
