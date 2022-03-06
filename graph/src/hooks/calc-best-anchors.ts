import { minBy } from "lodash";
import { Point, Size } from "./model";

const twoPoints = (point: Point, size: Size, directionX: number, directionY: number, arrowSize: number) => {
    const anchors = [
        {
            anchor: { x: point.x, y: point.y + directionY * (size.height / 2) },
            arrowStem: { x: point.x, y: point.y + directionY * (size.height / 2 + arrowSize) },
        },
        {
            anchor: { x: point.x + directionX * (size.width / 2), y: point.y },
            arrowStem: { x: point.x + directionX * (size.width / 2 + arrowSize), y: point.y },
        },
    ];
    return anchors;
};

function getDistance(to: Point, from: Point) {
    // use Pythagoras
    return Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
}

/** For a given Node's position and size, provide a good anchor point when joining from a point */
export function getAnchors(
    toPoint: Point,
    toSize: Size,
    fromPoint: Point,
    fromSize: Size,
    arrowSize: number
): [Point, Point, Point, Point] {
    let dx = toPoint.x - fromPoint.x;
    let dy = toPoint.y - fromPoint.y;
    const directionX = dx === 0 ? 1 : Math.abs(dx) / dx;
    const directionY = dy === 0 ? 1 : Math.abs(dy) / dy;
    const distances: { from: Point; to: Point; distance: number }[] = [];

    for (const { anchor: from, arrowStem: fromArrowStem } of twoPoints(
        fromPoint,
        fromSize,
        directionX,
        directionY,
        arrowSize
    )) {
        for (const { anchor: to, arrowStem: toArrowStem } of twoPoints(
            toPoint,
            toSize,
            directionX * -1,
            directionY * -1,
            arrowSize
        )) {
            distances.push({ from, to, distance: getDistance(toArrowStem, fromArrowStem) });
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
