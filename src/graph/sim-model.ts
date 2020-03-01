export interface SimNode {
    name: string;
    x?: number;
    y?: number;
    z?: number;
    width: number;
    height: number;
    depth: number;
}

export interface SimEdge {
    from: string;
    to: string;
    weight?: number;
}
