import { Box } from "@chakra-ui/react";
import { ExpandableGraph, GraphOptions, useExpandToggle, useSelectNodes } from "@diagrams/graph";
import { useDefaultOptions } from "@diagrams/graph/lib/use-ngraph";
import * as React from "react";
import { FC } from "react";
import { edges, nodesL3 } from "./data";

export const DemoGraphThreeDeep: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const options = useDefaultOptions(_options);
    const nodes = nodesL3.map((node) => ({
        ...node,
    }))
    const [expanded,onExpandToggleNode] = useExpandToggle(nodes);
    const [selectedNodes, onSelectNode] = useSelectNodes(nodes);
    
     return (
        <Box width="100%" height="100%" >
            <ExpandableGraph
                key="expandable"
                simpleNodes={nodes}
                simpleEdges={edges}
                onExpandToggleNode={onExpandToggleNode}
                expanded={expanded}
                onSelectNode={onSelectNode}
                selectedNodes={selectedNodes}
                options={options}
            />
        </Box>
    );
};
