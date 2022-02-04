import { intersection } from "lodash";
import { Body, Layout as NLayout, PhysicsSettings } from "ngraph.forcelayout";
import { Graph, Link } from "ngraph.graph";

export interface Size {
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

export const zeroPoint: Point = { x: 0, y: 0 };

export interface SimpleNode {
    /** Must be unique */
    name: string;
    /** hinted start position */
    positionHint?: Point;
    /** non-default size of node */
    size?: Size;
    /** Hierarchical level hint. If no children then level: 1 */
    backgroundColor?: string;
    border?: string;
    shadow?: boolean;
}

/** Node model */
export interface HierarchicalNode extends SimpleNode {
    /** Name of parent node if hierarchical */
    parent: string | null;
}

export interface PositionedNode extends SimpleNode {
    position: Point;
    body: Body;
    size: Size;
    initialPosition?: Point;
    initialSize?: Size;
    containerPosition: Point;
}

export interface PositionedHierarchicalNode extends HierarchicalNode, PositionedNode {
    parentNode: PositionedHierarchicalNode | null;
    size: Size;
    level: number;
}

export interface SimpleEdge {
    from: string;
    to: string;
    name:string;
    label?: string;
    color?: string;
    thickness?: number;
    labelColor?: string;
}

export interface PositionedEdge extends SimpleEdge {
    fromNode: PositionedNode;
    toNode: PositionedNode;
    name: string;
    link: Link<SimpleEdge>;
}

export interface HierarchicalEdge extends SimpleEdge {
    hierarchical?: boolean;
    score?: number;
}

export interface PositionedHierarchicalEdge extends HierarchicalEdge, PositionedEdge {}

export type NGraph = Graph<SimpleNode, SimpleEdge>;
export type NGraphLayout = NLayout<NGraph>;

export type MinMax = [number, number];

export interface GraphOptions extends Partial<PhysicsSettings> {
    /** display the length of springs between bodies */
    // debugSpringLengths?: boolean;
    /** display Mass of the node */
    debugMassNode?: boolean;
    defaultSize?: Size;
    textSize?: number;
    iterations?: number;
}

export type RequiredGraphOptions = Required<GraphOptions>;

// export interface LayoutNode extends GraphNode {
//     name: string;
//     size: Size;
//     position: Point;
//     body?: Body;
//     levelNumber: number;
//     isLeaf: boolean;
//     parentNode?: LayoutNode | null;
// }

// export interface Visible {
//     visible: boolean;
// }

// export type GraphNodeVisible = GraphNode & Visible;
// export type LayoutNodeVisible = LayoutNode & Visible;

// export interface LayoutEdge extends GraphEdge {
//     name: string;
//     points: Point[];
//     link: Link<GraphEdge>;
//     fromNode?: LayoutNode;
//     toNode?: LayoutNode;
//     hide?: boolean;
// }

// export interface Layout {
//     nodes: (LayoutNode & Visible)[];
//     edges: LayoutEdge[];
//     tree: { [index: string]: LayoutNodeVisible[] };
//     minPoint: Point;
//     maxPoint: Point;
//     textSize: number;
// }

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
export function getContainingRect(nodes: (PositionedNode & SimpleNode)[], fitSize: Size, padding = 0) {
    const estimate = nodes.reduce(
        (acc, node) => ({
            x1: Math.min(acc.x1, node.position.x * 1.1),
            y1: Math.min(acc.y1, node.position.y * 1.1),
            x2: Math.max(acc.x2, node.position.x * 1.1),
            y2: Math.max(acc.y2, node.position.y * 1.1),
        }),
        {
            x1: Number.MAX_SAFE_INTEGER,
            x2: Number.MIN_SAFE_INTEGER,
            y1: Number.MAX_SAFE_INTEGER,
            y2: Number.MIN_SAFE_INTEGER,
        }
    );
    const estimateSize = { width: estimate.x2 - estimate.x1, height: estimate.y2 - estimate.y1 };
    const minMax = nodes.reduce(
        (acc, node) => ({
            x1: Math.min(
                acc.x1,
                node.position.x - ((node.size.width / 2 + padding) / fitSize.width) * estimateSize.width
            ),
            y1: Math.min(
                acc.y1,
                node.position.y - ((node.size.height / 2 + padding) / fitSize.height) * estimateSize.height
            ),
            x2: Math.max(
                acc.x2,
                node.position.x + ((node.size.width / 2 + padding) / fitSize.width) * estimateSize.width
            ),
            y2: Math.max(
                acc.y2,
                node.position.y + ((node.size.height / 2 + padding) / fitSize.height) * estimateSize.height
            ),
        }),
        {
            x1: Number.MAX_SAFE_INTEGER,
            x2: Number.MIN_SAFE_INTEGER,
            y1: Number.MAX_SAFE_INTEGER,
            y2: Number.MIN_SAFE_INTEGER,
        }
    );
    return [
        { x: minMax.x1, y: minMax.y1 },
        { width: minMax.x2 - minMax.x1, height: minMax.y2 - minMax.y1 },
    ] as [Point, Size];
}

export function getMidPoint(from: number, to: number, delta: number) {
    return (to - from) * delta + from;
}

export function calculateDistance(
    edge: HierarchicalEdge,
    nodeDict: Record<string, HierarchicalNode>,
    node1: HierarchicalNode,
    node2: HierarchicalNode,
    defaultSize: Size
): number {
    if (edge.hierarchical) return defaultSize.width;
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
    return Math.max(Math.pow((distance * defaultSize.width) / 1, 1), defaultSize.width * 2);
}

export const transition = {
    type: "easeInOut",
    duration: 0.6,
};

export function adjustPosition(
    virtualPoint: Point,
    virtualTopLeft: Point,
    virtualSize: Size,
    targetSize: Size,
    targetPosition?: Point
) {
    return {
        x: ((virtualPoint.x - virtualTopLeft.x) / virtualSize.width) * targetSize.width + (targetPosition?.x ?? 0),
        y: ((virtualPoint.y - virtualTopLeft.y) / virtualSize.height) * targetSize.height + (targetPosition?.y ?? 0),
    };
}
