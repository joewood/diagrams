import { Box } from "@chakra-ui/react";
import { ExpandableGraph, GraphOptions, useExpandToggle, useFilterEdges, useSelectNodes } from "@diagrams/graph";
import { useDefaultOptions } from "@diagrams/graph/lib/use-ngraph";
import { range } from "lodash";
import * as React from "react";
import { FC } from "react";
import { edges, nodesL3 } from "./data";

export const DemoLarge: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const options = useDefaultOptions(_options);
    const nodes = range(0, 10).flatMap((i) =>
        nodesL3.map((node) => ({
            ...node,
            name: node.name + i,
            parent: node.parent ? node.parent + i : null,
        }))
    );
    const _edges = range(0, 10).flatMap((i) =>
        edges
            .map((e) => ({
                ...e,
                from: e.from + i, // Math.floor(Math.random() * 10),
                to: e.to + i, //Math.floor(Math.random() * 10),
            }))
            .map((e) => ({ ...e, name: e.from + " " + e.to }))
    );
    const [expanded, onExpandToggleNode] = useExpandToggle(nodes);
    const [selectedNodes, onSelectNode] = useSelectNodes(nodes);
    const [edgesFiltered, onFilterEdges] = useFilterEdges(nodes);
    console.log("EDGE", edgesFiltered);
    return (
        <Box width="100%" height="100%">
            <ExpandableGraph
                key="expandable"
                simpleNodes={nodes}
                simpleEdges={_edges}
                edgesFiltered={edgesFiltered}
                onFilterEdges={onFilterEdges}
                onExpandToggleNode={onExpandToggleNode}
                expanded={expanded}
                onSelectNode={onSelectNode}
                selectedNodes={selectedNodes}
                options={options}
            />
        </Box>
    );
};
