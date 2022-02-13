import { maxBy, minBy } from "lodash";
import { Body, Layout as NLayout, PhysicsSettings } from "ngraph.forcelayout";
import { Graph, Link } from "ngraph.graph";
import { PosSize, rectanglesOverlap } from "./use-ngraph";

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
    /** Name of parent node if hierarchical */
    parent: string | null;
    level?: number;
}

/** Node model */
// export interface HierarchicalNode extends SimpleNode {
// }

export interface PositionedNode extends SimpleNode {
    position: Point;
    body: Body;
    size: Size;
    // initialPosition?: Point;
    initialSize?: Size;
    parentVirtualPosition: Point;
    expanded?: boolean;
}

export type ScreenPositionedNode = Omit<PositionedNode, "position"> & {
    screenPosition: Point;
    // screenTopLeft: Point;
    initialScreenPosition?: Point;
    /** Screen Position that the set of nodes are rendered to */
    parentScreenPosition: Point;
};

export interface SimpleEdge {
    from: string;
    to: string;
    name: string;
    label?: string;
    color?: string;
    thickness?: number;
    labelColor?: string;
    hierarchical?: boolean;
    score?: number;
}

export interface PositionedEdge extends SimpleEdge {
    fromNode: PositionedNode;
    toNode: PositionedNode;
    name: string;
    link: Link<SimpleEdge>;
}

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
    if (!min) return [fromPoint, fromPoint, toPoint, toPoint];
    // if the point is further down/up than left/right then use bottom/top anchor
    let anchorFrom = min.from;
    let anchorTo = min.to;
    const getNormalExtent = (anchor: number, point: number, anchorToAnchorDist: number) => {
        const pointToAnchor = anchor - point;
        const dir = abs(pointToAnchor) / (pointToAnchor === 0 ? 1 : pointToAnchor);
        return (anchorToAnchorDist * dir) / 2;
    };
    let normalFrom: Point = {
        x: anchorFrom.x + getNormalExtent(anchorFrom.x, fromPoint.x, abs(anchorTo.x - anchorFrom.x)),
        y: anchorFrom.y + getNormalExtent(anchorFrom.y, fromPoint.y, abs(anchorTo.y - anchorFrom.y)),
    };
    let normalTo: Point = {
        x: anchorTo.x + getNormalExtent(anchorTo.x, toPoint.x, abs(anchorTo.x - anchorFrom.x)),
        y: anchorTo.y + getNormalExtent(anchorTo.y, toPoint.y, abs(anchorTo.y - anchorFrom.y)),
    };
    return [anchorFrom, normalFrom, normalTo, anchorTo];
}

/** Calculates the containing rectangle of a set of Nodes */
export function getContainingRect(
    nodes: (PositionedNode & SimpleNode)[],
    fitSize: Size,
    sizeOverride: Record<string, Size>,
    padding = 0
): [Point, Size] {
    const sizes: [Size, PositionedNode, PositionedNode][] = [];
    const getSize = (node: PositionedNode) => sizeOverride[node.name] ?? node.size;
    // we iterate over all node pairs to calculate the width and height.
    // the width of a node in screen space. the node positions are virtual space.
    if (nodes.length === 1) {
        return [
            {
                x: nodes[0].position.x - getSize(nodes[0]).width / 2 - padding,
                y: nodes[0].position.y - getSize(nodes[0]).height / 2 - padding,
            },
            {
                width: getSize(nodes[0]).width + 2 * padding,
                height: getSize(nodes[0]).height + 2 * padding,
            },
        ];
    }
    for (const node1 of nodes) {
        for (const node2 of nodes) {
            const virtualXDist = node2.position.x - node1.position.x;
            const virtualWidth =
                virtualXDist / (1 - (getSize(node1).width + getSize(node2).width + 2 * padding) / (2 * fitSize.width));
            const virtualYDist = node2.position.y - node1.position.y;
            const virtualHeight =
                virtualYDist /
                (1 - (getSize(node1).height + getSize(node2).height + 2 * padding) / (2 * fitSize.height));
            sizes.push([{ width: virtualWidth, height: virtualHeight }, node1, node2]);
        }
    }
    // select the widest and tallest node pair
    const widest = maxBy(sizes, (s) => s[0].width);
    const tallest = maxBy(sizes, (s) => s[0].height);
    if (!widest || !tallest)
        return [
            { x: 0, y: 0 },
            { width: 100, height: 100 },
        ];
    // R = S/M
    // Pm = Ps / R
    // Pm = Ps *M/S
    const topLeft = {
        x: widest[1].position.x - ((getSize(widest[1]).width + 2 * padding) * widest[0].width) / fitSize.width,
        y: tallest[1].position.y - ((getSize(tallest[1]).height + 2 * padding) * tallest[0].height) / fitSize.height,
    };
    const bottomRight = {
        x: widest[2].position.x + ((getSize(widest[2]).width + 2 * padding) * widest[0].width) / fitSize.width,
        y: tallest[2].position.y + ((getSize(tallest[2]).height + 2 * padding) * tallest[0].height) / fitSize.height,
    };
    return [topLeft, { width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y }] as [Point, Size];
}

export function getMidPoint(from: number, to: number, delta: number) {
    return (to - from) * delta + from;
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
    targetPosition?: Point,
    padding = 0
) {
    return {
        x:
            ((virtualPoint.x - virtualTopLeft.x) / virtualSize.width) * targetSize.width +
            (targetPosition?.x ?? 0) +
            padding,
        y:
            ((virtualPoint.y - virtualTopLeft.y) / virtualSize.height) * targetSize.height +
            (targetPosition?.y ?? 0) +
            padding,
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

export function getOverlap(posSizes: PosSize[], screenPosition: Point, screenSize: Size): [boolean, boolean] {
    let overlapping = false;
    const overlapPadding = 1.1;
    let paddedOverlapping = false;
    const shrinkPadding = 1.3;
    if (posSizes.length < 2) {
        if (posSizes.length === 1) {
            const posSize = { ...posSizes[0].screenPosition, ...posSizes[0].size };
            const [leftTop, bottomRight] = [
                {
                    x: posSize.x - posSize.width / 2,
                    y: posSize.y - posSize.height / 2,
                },
                {
                    x: posSize.x + posSize.width / 2,
                    y: posSize.y + posSize.height / 2,
                },
            ];
            if (leftTop.x < screenPosition.x || leftTop.y < screenPosition.y) {
                return [true, true];
            }
            if (
                bottomRight.x > screenPosition.x + screenSize.width ||
                bottomRight.y > screenPosition.y + screenSize.height
            ) {
                return [true, true];
            }
        }
        // console.log("Single Rect " + posSizes[0]?.name);
        return [false, true];
    }
    for (const posSize1 of posSizes) {
        const rect1 = { ...posSize1.screenPosition, ...posSize1.size };
        for (const posSize2 of posSizes) {
            if (posSize2 === posSize1) continue;
            const rect2 = { ...posSize2.screenPosition, ...posSize2.size };
            overlapping =
                overlapping ||
                rectanglesOverlap(
                    {
                        x: rect1.x - (rect1.width / 2) * overlapPadding,
                        y: rect1.y - (rect1.height / 2) * overlapPadding,
                    },
                    {
                        x: rect1.x + (rect1.width / 2) * overlapPadding,
                        y: rect1.y + (rect1.height / 2) * overlapPadding,
                    },
                    {
                        x: rect2.x - (rect2.width / 2) * overlapPadding,
                        y: rect2.y - (rect2.height / 2) * overlapPadding,
                    },
                    {
                        x: rect2.x + (rect2.width / 2) * overlapPadding,
                        y: rect2.y + (rect2.height / 2) * overlapPadding,
                    }
                );
            // we test if there's any overlap with a padding around the rec
            // if there's no overlap then we can probably shrink the targetArea
            paddedOverlapping =
                paddedOverlapping ||
                rectanglesOverlap(
                    {
                        x: rect1.x - (rect1.width / 2) * shrinkPadding,
                        y: rect1.y - (rect1.height / 2) * shrinkPadding,
                    },
                    {
                        x: rect1.x + (rect1.width / 2) * shrinkPadding,
                        y: rect1.y + (rect1.height / 2) * shrinkPadding,
                    },
                    {
                        x: rect2.x - (rect2.width / 2) * shrinkPadding,
                        y: rect2.y - (rect2.height / 2) * shrinkPadding,
                    },
                    {
                        x: rect2.x + (rect2.width / 2) * shrinkPadding,
                        y: rect2.y + (rect2.height / 2) * shrinkPadding,
                    }
                );
            // if any overlap, then we need to grow the target area. Quit.
            if (overlapping) break;
        }
        if (overlapping) break;
    }
    return [overlapping, paddedOverlapping];
}

export function getVisibleNode(
    node: SimpleNode,
    leafNodes: Record<string, SimpleNode>,
    nodesDict: Record<string, SimpleNode>,
    expanded: string[]
) {
    while (!!node && node.parent !== null && !(leafNodes[node.name] || expanded.includes(node.parent))) {
        node = nodesDict[node.parent ?? null];
    }
    return node;
}
