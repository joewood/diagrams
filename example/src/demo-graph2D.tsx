import { Box } from "@chakra-ui/react";
import { ExpandableGraph, GraphOptions, SimpleGraph } from "@diagrams/graph";
import { useDefaultOptions } from "@diagrams/graph/lib/use-ngraph-simple";
import * as React from "react";
import { FC, useCallback, useMemo, useState } from "react";
import { edges, nodesL2, nodesLeaf } from "./data";

export const DemoGraphSimple: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const [selected, setSelected] = useState<string>();
    const options = useDefaultOptions(_options);
    const expand = useCallback(({ name }: { name: string }) => {
        console.log("Name", name);
        setSelected(name);
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
                border: node.name === selected ? "red" : "black",
            })),
        [options.defaultSize, selected]
    );
    return (
        <Box width="100%" height="100%">
            <SimpleGraph nodes={largeNodes} edges={edges} options={options} onSelectNode={expand} />;
        </Box>
    );
};

export const DemoGraphLevel2: FC<{
    options: GraphOptions;
}> = ({ options: _options }) => {
    const [expanded, setExpanded] = useState<string[]>([]);
    const options = useDefaultOptions(_options);

    const onSelectNode = useCallback((args: { name: string }) => {
        setExpanded((exp) => (exp.includes(args.name) ? exp.filter((e) => e !== args.name) : [...exp, args.name]));
    }, []);
    return (
        <Box width="100%" height="100%">
            <ExpandableGraph
                key="expandable"
                nodes={nodesL2}
                edges={edges}
                onSelectNode={onSelectNode}
                expanded={expanded}
                options={options}
            />
        </Box>
    );
};

export const DemoGraphLevel3: FC<{
    options: GraphOptions;
}> = ({ options }) => {
    const [expanded, setExpanded] = useState<string[]>([]);
    return <Box />;
    // const graph = useNgraph(nodesL3, edges, expanded, { ...options, physics });
    // const onSelectNode = React.useCallback((args: { name: string }) => {
    //     setExpanded((exp) => (exp.includes(args.name) ? exp.filter((e) => e !== args.name) : [...exp, args.name]));
    // }, []);
    // return (
    //     <Box width="100%" height="100%">
    //         <Graph graph={graph} onSelectNode={onSelectNode} options={options} />;
    //     </Box>
    // );
};
