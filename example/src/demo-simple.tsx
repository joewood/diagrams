import { Box } from "@chakra-ui/react";
import { GraphOptions, SimpleGraph, useDefaultOptions, useSelectNodes } from "@diagrams/graph";
import * as React from "react";
import { FC, useMemo } from "react";
import { edges, nodesLeaf } from "./data";

export const DemoGraphSimple: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {

    const options = useDefaultOptions(_options);
    const [selectedNodes, onSelectNode] = useSelectNodes(nodesLeaf);
    return (
        <Box width="100%" height="100%">
            <SimpleGraph
                simpleNodes={nodesLeaf}
                simpleEdges={edges}
                options={options}
                onSelectNode={onSelectNode}
                selectedNodes={selectedNodes}
            />
            ;
        </Box>
    );
};
