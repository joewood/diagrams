import { Box } from "@chakra-ui/react";
import { GraphOptions, SimpleGraph, useDefaultOptions } from "@diagrams/graph";
import * as React from "react";
import { FC, useCallback, useMemo, useState } from "react";
import { edges, nodesLeaf } from "./data";

export const DemoGraphSimpleBusy: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const [selected, setSelected] = useState<string | null>(null);
    const options = useDefaultOptions(_options);
    const onSelect = useCallback(({ name }: { name: string }) => {
        setSelected(name);
    }, []);
    const largeNodes = useMemo(() => {
        const t = [
            ...nodesLeaf.map((node) => ({
                ...node,
                shadow: true,
            })),
            ...nodesLeaf.map((node) => ({
                ...node,
                name: node.name + "-2",
                shadow: true,
            })),
        ];
        return t.map((node) => ({
            ...node,
            size:
                node.name === selected
                    ? {
                          width: (node.size ?? options.defaultSize).width * 2,
                          height: (node.size ?? options.defaultSize).height * 2,
                      }
                    : node.size,
        }));
    }, [options.defaultSize, selected]);
    return (
        <Box width="100%" height="100%">
            <SimpleGraph
                simpleNodes={largeNodes}
                simpleEdges={edges}
                options={options}
                onSelectNode={onSelect}
                selectedNode={selected}
            />
            ;
        </Box>
    );
};
