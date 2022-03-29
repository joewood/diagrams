import { Box } from "@chakra-ui/react";
import { GraphOptions, SimpleGraph, useDefaultOptions, useSelectNodes } from "@diagrams/graph";
import * as React from "react";
import { FC, useMemo } from "react";
import { edges, nodesLeaf } from "./data";

export const DemoGraphSimpleBusy: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const moreNodes = useMemo(
        () => [
            ...nodesLeaf.map((node) => ({
                ...node,
            })),
            ...nodesLeaf.map((node) => ({
                ...node,
                name: node.name + "-2",
            })),
        ],
        []
    );
    const [selected, setSelected] = useSelectNodes(moreNodes);
    const options = useDefaultOptions(_options);
    return (
        <Box width="100%" height="100%">
            <SimpleGraph
                simpleNodes={nodesLeaf}
                simpleEdges={edges}
                options={options}
                onSelectNode={setSelected}
                selectedNodes={selected}
            />
            ;
        </Box>
    );
};
