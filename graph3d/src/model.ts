export interface Size {
    width: number;
    height: number;
}

export interface Size3 extends Size {
    depth: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface Point3 extends Point {
    z: number;
}

/** Node model */
export interface GraphNode {
    /** Must be unique */
    name: string;
    /** hinted start position */
    positionHint?: Point;
    type?: string;
    /** non-default size of node */
    size?: Size;
    /** Name of parent node if hierarchical */
    parent?: string;
    /** Hierarchical level hint. If no children then level: 1 */
    level?: number;
}

/** Node model */
export interface GraphNode3 extends GraphNode {
    /** hinted start position */
    positionHint?: Point3;
    /** non-default size of node */
    size?: Size3;
}

export interface GraphEdge {
    from: string;
    to: string;
    label?: string;
    weight?: number;
    score?: number;
}

export type MinMax = [number, number];

export interface LayoutNode extends GraphNode {
    name: string;
    size: Size;
    position: Point;
}

export interface LayoutNode3 extends LayoutNode {
    size: Size3;
    position: Point3;
}

export interface LayoutEdge extends GraphEdge {
    name: string;
    points: Point[];
    hide?: boolean;
}

export interface LayoutEdge3 extends LayoutEdge {
    points: Point3[];
}

export interface Layout {
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    minPoint: Point;
    maxPoint: Point;
    expanded: string[];
    textSize: number;
}

export interface Layout3 extends Layout {
    nodes: LayoutNode3[];
    edges: LayoutEdge3[];
    minPoint: Point3;
    maxPoint: Point3;
}

const abs = Math.abs;

/** For a given Node's position and size, provide a good anchor point when joining from a point
 * @returns Tuple of the anchor and the normal vector entering the anchor
 */
export function getAnchor(nodePosition: Point, nodeSize: Size, fromPoint: Point): [Point, Point] {
    let dy = fromPoint.y - nodePosition.y;
    const directionY = abs(dy) / dy;
    dy = dy - (nodeSize.height / 2) * directionY;
    let dx = fromPoint.x - nodePosition.x;
    const directionX = dx === 0 ? 1 : abs(dx) / dx;
    dx = dx - (nodeSize.width / 2) * directionX;
    // if the point is further down/up than left/right then use bottom/top anchor
    let anchor: Point =
        abs(dy) > abs(dx)
            ? { x: nodePosition.x, y: nodePosition.y + (nodeSize.height / 2) * directionY }
            : { x: nodePosition.x + (nodeSize.width / 2) * directionX, y: nodePosition.y };
    let normal: Point =
        abs(dy) > abs(dx)
            ? { x: nodePosition.x, y: (fromPoint.y + nodePosition.y) / 2 }
            : { x: (fromPoint.x + nodePosition.x) / 2, y: nodePosition.y };
    return [anchor, normal];
}

export function minMax(nodes: LayoutNode[], padding = 0): { x1: number; x2: number; y1: number; y2: number } {
    return nodes.reduce(
        (p, c) => ({
            x1: Math.min(p.x1, c.position.x - c.size.width / 2 - padding),
            y1: Math.min(p.y1, c.position.y - c.size.height / 2 - padding),
            x2: Math.max(p.x2, c.position.x + c.size.width / 2 + padding),
            y2: Math.max(p.y2, c.position.y + c.size.height / 2 + padding),
        }),
        {
            x1: Number.MAX_SAFE_INTEGER,
            x2: Number.MIN_SAFE_INTEGER,
            y1: Number.MAX_SAFE_INTEGER,
            y2: Number.MIN_SAFE_INTEGER,
        }
    );
}

export function getMidPoint(from: number, to: number, delta: number) {
    return (to - from) * delta + from;
}


export const transition = {
    type: "easeInOut",
    duration: 0.6,
};
