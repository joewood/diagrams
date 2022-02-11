import { Box } from "@chakra-ui/react";
import { ExpandableGraph, ExpandableGraphProps, GraphOptions } from "@diagrams/graph";
import { useDefaultOptions } from "@diagrams/graph/lib/use-ngraph";
import { uniq } from "lodash";
import * as React from "react";
import { FC, useCallback, useState } from "react";
import { edges, nodesL3 } from "./data";

export const DemoGraphThreeDeep: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const [expanded, setExpanded] = useState<string[]>([]);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const options = useDefaultOptions(_options);

    const onExpandToggleNode = useCallback<ExpandableGraphProps["onExpandToggleNode"]>(
        ({ name, expand }) => setExpanded((exp) => (expand ? uniq([...exp, name]) : exp.filter((e) => e !== name))),
        []
    );
    const onSelectNode = useCallback<ExpandableGraphProps["onSelectNode"]>(({ name }) => setSelectedNode(name), []);
    return (
        <Box width="100%" height="100%">
            <ExpandableGraph
                key="expandable"
                nodes={nodesL3.map((node) => ({
                    ...node,
                    shadow: !node.parent,
                }))}
                edges={edges}
                onExpandToggleNode={onExpandToggleNode}
                expanded={expanded}
                onSelectNode={onSelectNode}
                selectedNode={selectedNode}
                options={options}
            />
        </Box>
    );
};
