import { Box } from "@chakra-ui/react";
import { GraphOptions, SimpleGraph, useDefaultOptions } from "@diagrams/graph";
import * as React from "react";
import { FC, useCallback, useMemo, useState } from "react";
import { edges, nodesLeaf } from "./data";

export const DemoGraphSimple: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const [selected, setSelected] = useState<string | null>(null);
    const options = useDefaultOptions(_options);
    const onSelect = useCallback(({ name }: { name: string }) => {
        setSelected((prev) => (name === prev ? null : name));
    }, []);
    const largeNodes = useMemo(
        () =>
            nodesLeaf.map((node) => ({
                ...node,
                size:
                    node.name === selected
                        ? {
                              width: (node.size ?? options.defaultSize).width * 2,
                              height: (node.size ?? options.defaultSize).height * 2,
                          }
                        : node.size,
                border: node.name === selected ? "#000" : "#333",
                shadow: true,
            })),
        [options.defaultSize, selected]
    );
    return (
        <Box width="100%" height="100%">
            <SimpleGraph
                nodes={largeNodes}
                edges={edges}
                options={options}
                onSelectNode={onSelect}
                selectedNode={selected}
            />
            ;
        </Box>
    );
};
