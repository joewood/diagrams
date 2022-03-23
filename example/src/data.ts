import { SimpleEdge, SimpleNode } from "@diagrams/graph";
import { isArray, uniq } from "lodash";
import { cubehelix, brewer, scale } from "chroma-js";

interface Tree {
    [index: string]: Tree | string[];
}

const Network = [
    "Data Network",
    "Voice Network",
    "2-",
    "Internet Connectivity",
    "Virtual Private Network",
    "1-",
    "Domain Services",
    "Load Balancing",
    "0-",
];

const Compute = [
    "Physical Compute",
    "Virtual Compute and Containers",
    "Compute on Demand",
    "Very long description of something that needs growing",
];

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

// function treeToNodeArray(tree: Tree) {
//     return Object.keys(tree).flatMap((node) => branchToNodeArray(Array.isArray(tree[node]) ? null : tree[node], node));
// }

/**
 * When parentNode is null, just add child branches.
 * Or sub-branch of tree, parentNode is the node created and added
 * Or string leaf branch, return node
 */
function branchToNodeArray(tree: Tree | string[] | null, branchName?: string, parentNode?: SimpleNode): SimpleNode[] {
    const node: SimpleNode | undefined =
        (branchName && {
            ...(parentNode ?? {}),
            name: branchName!,
            parent: parentNode?.name ?? null,
        }) ||
        undefined;
    // is leaf node then branchName is a node, just return the leaf node
    if (tree === null) return [node!];
    if (isArray(tree)) return [node!, ...tree.flatMap((leaf) => branchToNodeArray(null, leaf, node))];
    // otherwise we're in a tree
    const t = [
        node!,
        ...Object.entries(tree || {}).flatMap(([childBranchName, childBranch]) =>
            branchToNodeArray(childBranch, childBranchName, node)
        ),
    ].filter(Boolean);
    return t;
}

export const edges: SimpleEdge[] = [
    { from: "Compute on Demand", to: "Virtual Compute and Containers", label: "Comp Uses VMs" },
    { from: "Virtual Compute and Containers", to: "Physical Compute", label: "VMs on HyperVisor" },
    { from: "Database", to: "Virtual Compute and Containers", label: "DBs on VMs" },
    { from: "Database", to: "Load Balancing", label: "DB Scale using LB" },
].map((e) => ({ ...e, name: `${e.from} -> ${e.to}` }));
const connectedNodes = edges.reduce<string[]>((p, c) => [...p, c.from, c.to], []);

export const nodesL3: SimpleNode[] = branchToNodeArray(nodeTree);
const roots = nodesL3.filter((node) => !node.parent).map((node) => node.name);
const parents = uniq(nodesL3.map((node) => node.parent).filter(Boolean));
export const nodesL2: SimpleNode[] = branchToNodeArray(nodeTree)
    .filter((node) => !!node.parent)
    .map((node) => ({ ...node, parent: node.parent && roots.includes(node.parent) ? null : node.parent }));
export const nodesLeaf: SimpleNode[] = branchToNodeArray(nodeTree)
    .filter((n) => !parents.includes(n.name) && connectedNodes.includes(n.name))
    .map((n, i) => ({ ...n, size: { width: ((i * 20) % 100) + 100, height: ((i * 20) % 100) + 100 } }));
