/** A node in the Simulation, as specified by the user */
export interface SimNode {
    name: string;
    x?: number;
    y?: number;
    z?: number;
    type?: string;
    width: number;
    height: number;
    depth: number;
}

/** A connected Edge between two nodes in the system, as specified by the user */
export interface SimEdge {
    from: string;
    to: string;
    weight?: number;
}
