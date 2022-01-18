import { intersection } from "lodash";
import { Body } from "ngraph.forcelayout";
import { Link } from "ngraph.graph";

export interface Size {
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
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
    parent: string | null;
    /** Hierarchical level hint. If no children then level: 1 */
    // level?: number;
}

export interface GraphEdge {
    from: string;
    to: string;
    label?: string;
    weight?: number;
    hierarchical?: boolean;
    score?: number;
}

export type MinMax = [number, number];

export interface LayoutNode extends GraphNode {
    name: string;
    size: Size;
    position: Point;
    body?: Body;
    levelNumber?: number;
}

export interface Visible {
    visible: boolean;
}

export type GraphNodeVisible = GraphNode & Visible;
export type LayoutNodeVisible = LayoutNode & Visible;

export interface LayoutEdge extends GraphEdge {
    name: string;
    points: Point[];
    link: Link<GraphEdge>;
    hide?: boolean;
}

export interface Layout {
    nodes: (LayoutNode & Visible)[];
    edges: LayoutEdge[];
    tree: { [index: string]: LayoutNodeVisible[] };
    minPoint: Point;
    maxPoint: Point;
    // expanded?: string[];
    textSize: number;
}

const abs = Math.abs;

/** For a given Node's position and size, provide a good anchor point when joining from a point */
export function getAnchor(nodePosition: Point, nodeSize: Size, fromPoint: Point): Point {
    let dy = fromPoint.y - nodePosition.y;
    const directionY = abs(dy) / dy;
    dy = dy - (nodeSize.height / 2) * directionY;
    let dx = fromPoint.x - nodePosition.x;
    const directionX = dx === 0 ? 1 : abs(dx) / dx;
    dx = dx - (nodeSize.width / 2) * directionX;
    // if the point is further down/up than left/right then use bottom/top anchor
    if (abs(dy) > abs(dx)) {
        return { x: nodePosition.x, y: nodePosition.y + (nodeSize.height / 2) * directionY };
    } else {
        return { x: nodePosition.x + (nodeSize.width / 2) * directionX, y: nodePosition.y };
    }
}

/** Calculates the containing rectangle of a set of Nodes */
export function getContainingRect(nodes: LayoutNode[], padding = 0): { position: Point; size: Size } {
    const minMax = nodes.reduce(
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
    return {
        position: { x: minMax.x1, y: minMax.y1 },
        size: { width: minMax.x2 - minMax.x1, height: minMax.y2 - minMax.y1 },
    };
}

export function getMidPoint(from: number, to: number, delta: number) {
    return (to - from) * delta + from;
}

export function calculateDistance(
    edge: GraphEdge,
    nodeDict: Record<string, GraphNode>,
    node1: GraphNode,
    node2: GraphNode
): number {
    if (edge.hierarchical) return 5;
    const path1: string[] = [];
    while (!!node1?.parent) {
        path1.push(node1.parent);
        node1 = nodeDict[node1.parent];
    }
    const path2: string[] = [];
    while (!!node2?.parent) {
        path2.push(node2.parent);
        node2 = nodeDict[node2.parent];
    }
    const distance = path1.length + path2.length - intersection(path1, path2).length;
    return Math.max(Math.pow(2, distance) * 10, 20);
}

export const transition = {
    type: "easeInOut",
    duration: 0.6,
};
