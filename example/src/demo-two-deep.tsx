import { Box } from "@chakra-ui/react";
import { ExpandableGraph, GraphOptions } from "@diagrams/graph";
import { useDefaultOptions } from "@diagrams/graph/lib/use-ngraph-simple";
import * as React from "react";
import { FC, useCallback, useState } from "react";
import { edges, nodesL2 } from "./data";

export const DemoGraphTwoDeep: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const [expanded, setExpanded] = useState<string[]>([]);
    const options = useDefaultOptions(_options);

    const onSelectNode = useCallback((args: { name: string }) => {
        setExpanded((exp) => (exp.includes(args.name) ? exp.filter((e) => e !== args.name) : [...exp, args.name]));
    }, []);
    return (
        <Box width="100%" height="100%">
            <ExpandableGraph
                key="expandable"
                nodes={nodesL2.map((node) => ({
                    ...node,
                    shadow: !node.parent,
                }))}
                edges={edges}
                onSelectNode={onSelectNode}
                expanded={expanded}
                options={options}
            />
        </Box>
    );
};
