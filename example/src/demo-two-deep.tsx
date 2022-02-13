import { Box } from "@chakra-ui/react";
import { ExpandableGraph, ExpandableGraphProps, GraphOptions, useDefaultOptions } from "@diagrams/graph";
import { uniq } from "lodash";
import * as React from "react";
import { FC, useCallback, useState } from "react";
import { edges, nodesL2 } from "./data";

export const DemoGraphTwoDeep: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const [expanded, setExpanded] = useState<string[]>([]);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const options = useDefaultOptions(_options);
    const onExpandToggleNode = useCallback<Required<ExpandableGraphProps>["onExpandToggleNode"]>(
        ({ name, expand }) => setExpanded((exp) => (expand ? uniq([...exp, name]) : exp.filter((e) => e !== name))),
        []
    );
    const onSelectNode = useCallback<Required<ExpandableGraphProps>["onSelectNode"]>(
        ({ name }) => setSelectedNode(name),
        []
    );
    return (
        <Box width="100%" height="100%">
            <ExpandableGraph
                key="expandable"
                simpleNodes={nodesL2.map((node) => ({
                    ...node,
                    shadow: !node.parent,
                }))}
                simpleEdges={edges}
                onExpandToggleNode={onExpandToggleNode}
                expanded={expanded}
                onSelectNode={onSelectNode}
                selectedNode={selectedNode}
                options={options}
            />
        </Box>
    );
};