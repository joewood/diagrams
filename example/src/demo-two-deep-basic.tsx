import { Box } from "@chakra-ui/react";
import {
    ExpandableGraph,
    ExpandableGraphProps,
    GraphOptions,
    SimpleEdge,
    SimpleNode,
    useDefaultOptions,
} from "@diagrams/graph";
import { uniq } from "lodash";
import * as React from "react";
import { FC, useCallback, useState } from "react";
import { edges, nodesL2 } from "./data";

const nodesBasic: SimpleNode[] = [
    {
        name: "One",
        parent: null,
        shadow: true,
    },
    // {
    //     name: "two",
    //     parent: null,
    //     shadow: true,
    // },
    {
        name: "one.1",
        parent: "One",
    },
    {
        name: "one.2",
        parent: "One",
    },
    // {
    //     name: "two.1",
    //     parent: "two",
    // },
];

const edges2: SimpleEdge[] = []; //{ from: "one.1", to: "two.1", name: "one-two", label: "one-two" }];

export const DemoGraphTwoDeepBasic: FC<{
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
                simpleNodes={nodesBasic}
                simpleEdges={edges2}
                onExpandToggleNode={onExpandToggleNode}
                expanded={expanded}
                onSelectNode={onSelectNode}
                selectedNode={selectedNode}
                options={options}
            />
        </Box>
    );
};
