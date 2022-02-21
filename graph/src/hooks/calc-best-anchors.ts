import { minBy } from "lodash";
import { Point, Size } from "./model";

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
    const directionX = dx === 0 ? 1 : Math.abs(dx) / dx;
    const directionY = dy === 0 ? 1 : Math.abs(dy) / dy;
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
        const dir = Math.abs(pointToAnchor) / (pointToAnchor === 0 ? 1 : pointToAnchor);
        return (anchorToAnchorDist * dir) / 2;
    };
    let normalFrom: Point = {
        x: anchorFrom.x + getNormalExtent(anchorFrom.x, fromPoint.x, Math.abs(anchorTo.x - anchorFrom.x)),
        y: anchorFrom.y + getNormalExtent(anchorFrom.y, fromPoint.y, Math.abs(anchorTo.y - anchorFrom.y)),
    };
    let normalTo: Point = {
        x: anchorTo.x + getNormalExtent(anchorTo.x, toPoint.x, Math.abs(anchorTo.x - anchorFrom.x)),
        y: anchorTo.y + getNormalExtent(anchorTo.y, toPoint.y, Math.abs(anchorTo.y - anchorFrom.y)),
    };
    return [anchorFrom, normalFrom, normalTo, anchorTo];
}

