import { minBy } from "lodash";
import { Point, Size } from "./model";

export function direction(x: Point, y: Point): [number, number] {
    const dx = y.x - x.x === 0 ? 0 : Math.abs(y.x - x.x) / (y.x - x.x);
    const dy = y.y - x.y === 0 ? 0 : Math.abs(y.y - x.y) / (y.y - x.y);
    return [dx, dy];
}

const twoPoints = (point: Point, size: Size, arrowSize: number) => {
    const anchors = [
        {
            anchor: { x: point.x, y: point.y + 1 * (size.height / 2) },
            arrowStem: { x: point.x, y: point.y + 1 * (size.height / 2 + arrowSize) },
            directionX: 0,
            directionY: 1,
        },
        {
            anchor: { x: point.x + 1 * (size.width / 2), y: point.y },
            arrowStem: { x: point.x + 1 * (size.width / 2 + arrowSize), y: point.y },
            directionX: 1,
            directionY: 0,
        },
        {
            anchor: { x: point.x, y: point.y - 1 * (size.height / 2) },
            arrowStem: { x: point.x, y: point.y - 1 * (size.height / 2 + arrowSize) },
            directionX: 0,
            directionY: -1,
        },
        {
            anchor: { x: point.x - 1 * (size.width / 2), y: point.y },
            arrowStem: { x: point.x - 1 * (size.width / 2 + arrowSize), y: point.y },
            directionX: -1,
            directionY: 0,
        },
    ];
    return anchors;
};

export function getDistance(to: Point, from: Point) {
    // use Pythagoras
    return Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
}

export interface AnchorDetails {
    fromAnchor: Point;
    toAnchor: Point;
    fromArrowStem: Point;
    toArrowStem: Point;
    distance: number;
    directionX: number;
    directionY: number;
    fromNormal: Point;
    toNormal: Point;
}

/** For a given Node's position and size, provide a good anchor point when joining from a point */
export function getAnchors(
    toPoint: Point,
    toSize: Size,
    fromPoint: Point,
    fromSize: Size,
    arrowSize: number
): AnchorDetails {
    //  [Point, Point, Point, Point, Point, Point] {
    let dx = toPoint.x - fromPoint.x;
    let dy = toPoint.y - fromPoint.y;
    // const directionX = dx === 0 ? 1 : Math.abs(dx) / dx;
    // const directionY = dy === 0 ? 1 : Math.abs(dy) / dy;
    // track all possible anchor points, don't calculate normal until we've found the best two anchors
    const distances: Omit<AnchorDetails, "fromNormal" | "toNormal">[] = [];

    for (const { anchor: from, arrowStem: fromArrowStem, directionX: fromDx, directionY: fromDy } of twoPoints(
        fromPoint,
        fromSize,
        arrowSize
    )) {
        for (const { anchor: to, arrowStem: toArrowStem, directionX: toDx, directionY: toDy } of twoPoints(
            toPoint,
            toSize,
            arrowSize
        )) {
            const angle = Math.acos(
                (Math.abs((toArrowStem.x - fromArrowStem.x) * fromDx) +
                    Math.abs((toArrowStem.y - fromArrowStem.y) * fromDy)) /
                    getDistance(toArrowStem, fromArrowStem)
            );
            // console.log(
            //     `angle ${(angle / Math.PI / 2) * 360} Dist:${getDistance(toArrowStem, fromArrowStem)} x:${Math.abs(
            //         (toArrowStem.x - fromArrowStem.x) * directionX
            //     )} y:${Math.abs((toArrowStem.y - fromArrowStem.y) * directionY)}`
            // );
            if (Math.abs(angle) < Math.PI / 2.5)
                distances.push({
                    fromAnchor: from,
                    toAnchor: to,
                    fromArrowStem,
                    toArrowStem,
                    distance: getDistance(toArrowStem, fromArrowStem),
                    directionX: toDx,
                    directionY: toDy,
                });
        }
    }
    const min = minBy(distances, (p) => p.distance);
    if (!min)
        return {
            fromAnchor: fromPoint,
            fromArrowStem: fromPoint,
            fromNormal: fromPoint,
            toNormal: toPoint,
            toArrowStem: toPoint,
            toAnchor: toPoint,
            directionX: 1,
            directionY: 1,
            distance: 0,
        };
    // if the point is further down/up than left/right then use bottom/top anchor
    let fromAnchor = min.fromAnchor;
    let toAnchor = min.toAnchor;
    const getNormalExtent = (anchor: number, point: number, anchorToAnchorDist: number) => {
        const pointToAnchor = anchor - point;
        const dir = Math.abs(pointToAnchor) / (pointToAnchor === 0 ? 1 : pointToAnchor);
        return (anchorToAnchorDist * dir) / 2;
    };
    let fromNormal: Point = {
        x: fromAnchor.x + getNormalExtent(fromAnchor.x, fromPoint.x, Math.abs(toAnchor.x - fromAnchor.x)),
        y: fromAnchor.y + getNormalExtent(fromAnchor.y, fromPoint.y, Math.abs(toAnchor.y - fromAnchor.y)),
    };
    let toNormal: Point = {
        x: toAnchor.x + getNormalExtent(toAnchor.x, toPoint.x, Math.abs(toAnchor.x - fromAnchor.x)),
        y: toAnchor.y + getNormalExtent(toAnchor.y, toPoint.y, Math.abs(toAnchor.y - fromAnchor.y)),
    };
    return {
        fromAnchor,
        fromArrowStem: min.fromArrowStem,
        fromNormal,
        toNormal,
        toArrowStem: min.toArrowStem,
        toAnchor,
        directionX: min.directionX,
        directionY: min.directionY,
        distance: min.distance,
    };
}
