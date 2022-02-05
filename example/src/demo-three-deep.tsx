import { Box } from "@chakra-ui/react";
import { ExpandableGraph, GraphOptions } from "@diagrams/graph";
import { useDefaultOptions } from "@diagrams/graph/lib/use-ngraph";
import * as React from "react";
import { FC, useCallback, useState } from "react";
import { edges, nodesL3 } from "./data";

export const DemoGraphThreeDeep: FC<{
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
                nodes={nodesL3}
                edges={edges}
                onSelectNode={onSelectNode}
                expanded={expanded}
                options={options}
            />
        </Box>
    );
};
