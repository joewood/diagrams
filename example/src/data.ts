import { GraphEdge, GraphNode } from "@diagrams/graph";
import { uniq } from "lodash";

interface Tree {
    [index: string]: Tree | string[];
}

const Network = [
    "Data Network",
    "Voice Network",
    "Internet Connectivity",
    "Virtual Private Network",
    "Domain Services",
    "Load Balancing",
];

const Compute = ["Physical Compute", "Virtual Compute & Containers", "Compute on Demand"];

const Data = ["Database", "Distributed Cache", "Data Warehouse"];

const nodeTree = {
    Infrastructure: {
        Network,
        Compute,
    },
    Other: {
        Data,
    },
} as Tree;

function red(t: Tree, parent: string | null): GraphNode[] {
    return Object.keys(t).reduce<GraphNode[]>((p, c) => {
        const e = t[c];
        const parentNode: GraphNode = { name: c, parent };
        if (Array.isArray(e)) {
            const children = e.map<GraphNode>((child) => ({ name: child, parent: c }));
            return [...p, parentNode, ...children];
        } else {
            const children = red(e, c);
            return [...p, parentNode, ...children];
        }
    }, []);
}

export const edges: GraphEdge[] = [
    { from: "Compute on Demand", to: "Virtual Compute & Containers", label: "Uses" },
    { from: "Virtual Compute & Containers", to: "Physical Compute", label: "Uses" },
    { from: "Database", to: "Virtual Compute & Containers", label: "Uses" },
    { from: "Database", to: "Load Balancing", label: "Uses" },
];
const connectedNodes = edges.reduce<string[]>((p, c) => [...p, c.from, c.to], []);

export const nodesL3: GraphNode[] = red(nodeTree, null);
const roots = nodesL3.filter((node) => !node.parent).map((node) => node.name);
const parents = uniq(nodesL3.map((node) => node.parent).filter(Boolean));
export const nodesL2: GraphNode[] = red(nodeTree, null)
    .filter((node) => !!node.parent)
    .map((node) => ({ ...node, parent: node.parent && roots.includes(node.parent) ? null : node.parent }));
export const nodesLeaf = red(nodeTree, null).filter(
    (n) => !parents.includes(n.name) && connectedNodes.includes(n.name)
);
