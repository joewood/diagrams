import { Box } from "@chakra-ui/react";
import {
    ExpandableGraph,
    GraphOptions,
    SimpleEdge,
    SimpleNode,
    useFilterEdges,
    useDefaultOptions,
    useExpandToggle,
    useSelectNodes,
} from "@diagrams/graph";
import * as React from "react";
import { FC } from "react";

const nodesBasic: SimpleNode[] = [
    {
        name: "One",
        parent: null,
    },
    {
        name: "two",
        parent: null,
    },
    {
        name: "one.1",
        parent: "One",
    },
    {
        name: "one.2",
        parent: "One",
    },
    {
        name: "two.1",
        parent: "two",
    },
];

const edges2: SimpleEdge[] = []; //{ from: "one.1", to: "two.1", name: "one-two", label: "one-two" }];

export const DemoGraphTwoDeepBasic: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const [expanded, setExpanded] = useExpandToggle(nodesBasic);
    const [selectedNode, setSelectedNode] = useSelectNodes(nodesBasic);
    const [edgesFiltered, onFilterEdges] = useFilterEdges(nodesBasic);

    const options = useDefaultOptions(_options);
    return (
        <Box width="100%" height="100%">
            <ExpandableGraph
                key="expandable"
                simpleNodes={nodesBasic}
                simpleEdges={edges2}
                edgesFiltered={edgesFiltered}
                onFilterEdges={onFilterEdges}
                onExpandToggleNode={setExpanded}
                expanded={expanded}
                onSelectNode={setSelectedNode}
                selectedNodes={selectedNode}
                options={options}
            />
        </Box>
    );
};
