declare module "ngraph.forcelayout" {
    interface Layout {
        getNodePosition(nodeId: NodeID): Vector3;
        getGraphRect(): { x1: number; y1: number; x2: number; y2: number; z1: number; z2: number };
    }
}
