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
    const largeNodes = useMemo(
        () =>
            nodesLeaf.map((node) => ({
                ...node,
                size: selectedNodes.includes(node.name)
                    ? {
                          width:
                              (node.size ?? { width: options.defaultWidth, height: options.defaultHeight }).width * 2,
                          height:
                              (node.size ?? { width: options.defaultWidth, height: options.defaultHeight }).height * 2,
                      }
                    : node.size,
                shadow: true,
            })),
        [options.defaultHeight, options.defaultWidth, selectedNodes]
    );
    return (
        <Box width="100%" height="100%">
            <SimpleGraph
                simpleNodes={largeNodes}
                simpleEdges={edges}
                options={options}
                onSelectNode={onSelectNode}
                selectedNodes={selectedNodes}
            />
            ;
        </Box>
    );
};
