import { SimpleEdge, SimpleNode, HierarchicalNode } from "@diagrams/graph";
import { isArray, uniq } from "lodash";

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

const styleMap: Record<string, Omit<SimpleNode, "name" | "positionHint" | "type" | "size" | "parent">> = {
    Compute: {
        backgroundColor: "yellow",
    },
    Network: {
        backgroundColor: "#9090f0",
    },
    Data: {
        backgroundColor: "#90f090",
    },
};

// function treeToNodeArray(tree: Tree) {
//     return Object.keys(tree).flatMap((node) => branchToNodeArray(Array.isArray(tree[node]) ? null : tree[node], node));
// }

/**
 * When parentNode is null, just add child branches.
 * Or sub-branch of tree, parentNode is the node created and added
 * Or string leaf branch, return node
 */
function branchToNodeArray(
    tree: Tree | string[] | null,
    branchName?: string,
    parentNode?: HierarchicalNode
): HierarchicalNode[] {
    const node: HierarchicalNode | undefined =
        (branchName && {
            ...(parentNode ?? {}),
            ...(styleMap[branchName] ?? {}),
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
    { from: "Compute on Demand", to: "Virtual Compute & Containers", label: "Comp Uses VMs" },
    { from: "Virtual Compute & Containers", to: "Physical Compute", label: "VMs on HyperVisor" },
    { from: "Database", to: "Virtual Compute & Containers", label: "DBs on VMs" },
    { from: "Database", to: "Load Balancing", label: "DB Scale using LB" },
].map((e) => ({ ...e, name: `${e.from} -> ${e.to}` }));
const connectedNodes = edges.reduce<string[]>((p, c) => [...p, c.from, c.to], []);

export const nodesL3: HierarchicalNode[] = branchToNodeArray(nodeTree);
const roots = nodesL3.filter((node) => !node.parent).map((node) => node.name);
const parents = uniq(nodesL3.map((node) => node.parent).filter(Boolean));
export const nodesL2: HierarchicalNode[] = branchToNodeArray(nodeTree)
    .filter((node) => !!node.parent)
    .map((node) => ({ ...node, parent: node.parent && roots.includes(node.parent) ? null : node.parent }));
export const nodesLeaf: SimpleNode[] = branchToNodeArray(nodeTree)
    .filter((n) => !parents.includes(n.name) && connectedNodes.includes(n.name))
    .map((n, i) => ({ ...n, size: { width: ((i * 20) % 100) + 100, height: ((i * 20) % 100) + 100 } }));
console.log("SIMPLE", nodesLeaf);
