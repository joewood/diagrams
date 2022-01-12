import { GraphEdge } from "@diagrams/graph";

const nodeTree = {
    Network: {
        children: [
            "Data Network",
            "Voice Network",
            "Internet Connectivity",
            "Virtual Private Network",
            "Domain Services",
            "Load Balancing",
        ],
    },
    Compute: {
        children: ["Physical Compute", "Virtual Compute & Containers", "Compute on Demand"],
    },
    Data: {
        children: ["Database", "Distributed Cache", "Data Warehouse"],
    },
} as { [index: string]: { children: string[] } };

export const nodes = Object.keys(nodeTree).reduce(
    (p, parent) => [
        ...p,
        { name: parent, level: 2, parent: null },
        ...nodeTree[parent].children.map((child) => ({ name: child, parent, level: 1 })),
    ],
    [] as any[]
);

export const edges : GraphEdge[] = [
    { from: "Compute on Demand", to: "Virtual Compute & Containers", label: "Uses" },
    { from: "Virtual Compute & Containers", to: "Physical Compute", label: "Uses" },
    { from: "Database", to: "Virtual Compute & Containers", label: "Uses" },
    { from: "Database", to: "Load Balancing", label: "Uses" },
];
