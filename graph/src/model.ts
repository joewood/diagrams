import { intersection, minBy } from "lodash";
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
    expanded?: boolean;
}

export interface PositionedHierarchicalNode extends HierarchicalNode, PositionedNode {
    parentNode: PositionedHierarchicalNode | null;
    size: Size;
    level: number;
}

export interface SimpleEdge {
    from: string;
    to: string;
    name: string;
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

const abs = Math.abs;

const twoPoints = (point: Point, size: Size, directionX: number, directionY: number) => [
    { x: point.x, y: point.y + (directionY * size.height) / 2 },
    { x: point.x + (directionX * size.width) / 2, y: point.y },
];

/** For a given Node's position and size, provide a good anchor point when joining from a point */
export function getAnchors(
    toPoint: Point,
    toSize: Size,
    fromPoint: Point,
    fromSize: Size
): [Point, Point, Point, Point] {
    let dx = toPoint.x - fromPoint.x;
    let dy = toPoint.y - fromPoint.y;
    const directionX = dx === 0 ? 1 : abs(dx) / dx;
    const directionY = dy === 0 ? 1 : abs(dy) / dy;
    const distances: { from: Point; to: Point; distance: number }[] = [];
    for (const from of twoPoints(fromPoint, fromSize, directionX, directionY)) {
        for (const to of twoPoints(toPoint, toSize, directionX * -1, directionY * -1)) {
            distances.push({ from, to, distance: Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2) });
        }
    }
    const min = minBy(distances, (p) => p.distance);
    if (!min) return [fromPoint,fromPoint,toPoint,toPoint]
    // if the point is further down/up than left/right then use bottom/top anchor
    let anchorFrom = min.from;
    let normalFrom: Point = {
        x: fromPoint.x + (anchorFrom.x - fromPoint.x) * 2,
        y: fromPoint.y + (anchorFrom.y - fromPoint.y) * 2,
    };
    let anchorTo = min.to;
    let normalTo: Point = {
        x: toPoint.x + (anchorTo.x - toPoint.x) * 2,
        y: toPoint.y + (anchorTo.y - toPoint.y) * 2,
    };
    return [anchorFrom, normalFrom, normalTo, anchorTo];
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

export type NumericOpts = "gravity" | "springCoefficient" | "springLength" | "dragCoefficient" | "theta" | "textSize";
export type PhysicsSettingsBag = {
    [Property in keyof Pick<RequiredGraphOptions, NumericOpts>]: {
        name: string;
        description: string;
        default: RequiredGraphOptions[Property];
        minVal: RequiredGraphOptions[Property];
        maxVal: RequiredGraphOptions[Property];
    };
};

export const physicsMeta: PhysicsSettingsBag = {
    gravity: {
        name: "Gravity - Coulomb's law coefficient",
        description:
            "It's used to repel nodes thus should be negative if you make it positive nodes start attract each other",
        minVal: -1500,
        maxVal: 0,
        default: -12,
    },
    springCoefficient: {
        name: "Hook's law coefficient",
        description: "1 - solid spring.",
        minVal: 0,
        maxVal: 1,
        default: 0.8,
    },
    springLength: {
        name: "Ideal length for links",
        description: "Ideal length for links (springs in physical model).",
        minVal: 2,
        maxVal: 500,
        default: 10,
    },
    theta: {
        name: "Theta coefficient from Barnes Hut simulation",
        description:
            "The closer it's to 1 the more nodes algorithm will have to go through. Setting it to one makes Barnes Hut simulation no different from brute-force forces calculation (each node is considered)",
        minVal: 0,
        maxVal: 1,
        default: 0.8,
    },
    dragCoefficient: {
        name: "Drag force coefficient",
        description:
            "Used to slow down system, thus should be less than 1. The closer it is to 0 the less tight system will be.",
        minVal: 0,
        maxVal: 1,
        default: 0.9,
    },
    textSize: {
        name: "Size of text",
        description: "Default font size",
        minVal: 1,
        maxVal: 20,
        default: 10,
    },
};
