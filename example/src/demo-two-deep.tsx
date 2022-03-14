import { Box } from "@chakra-ui/react";
import { ExpandableGraph, GraphOptions, useDefaultOptions, useExpandToggle, useSelectNodes } from "@diagrams/graph";
import * as React from "react";
import { FC } from "react";
import { edges, nodesL2 } from "./data";

export const DemoGraphTwoDeep: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const nodes = nodesL2.map((node) => ({
        ...node,
    }));
    const [selectedNodes, setSelectedNode] = useSelectNodes(nodes);
    const [expanded, setExpanded] = useExpandToggle(nodes);
    const options = useDefaultOptions(_options);
    return (
        <Box width="100%" height="100%">
            <ExpandableGraph
                key="expandable"
                simpleNodes={nodes}
                simpleEdges={edges}
                onExpandToggleNode={setExpanded}
                expanded={expanded}
                onSelectNode={setSelectedNode}
                selectedNodes={selectedNodes}
                options={options}
            />
        </Box>
    );
};
