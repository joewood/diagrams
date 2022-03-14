import { Point, Size } from "./model";
import { extent } from "./use-screen-vector";

const { round, abs } = Math;
/**  */
export function rectanglesOverlapSize(
    existingPoint: Point & Size,
    newPoint: Point & Size,
    rectMargin: number,
    vx: number,
    vy: number
): Point | null {
    // calculate the topleft, bottomright points with margin
    const newPointHalfWidth = newPoint.width / 2 + rectMargin;
    const newPointHalfHeight = newPoint.height / 2 + rectMargin;
    const existingPointHalfWidth = existingPoint.width / 2 + rectMargin;
    const existingPointHalfHeight = existingPoint.height / 2 + rectMargin;
    const newTopLeft = {
        x: round(newPoint.x - newPointHalfWidth),
        y: round(newPoint.y - newPointHalfHeight),
    };
    const newBottomRight = {
        x: round(newPoint.x + newPointHalfWidth),
        y: round(newPoint.y + newPointHalfHeight),
    };
    const existingTopLeft = {
        x: round(existingPoint.x - existingPointHalfWidth),
        y: round(existingPoint.y - existingPointHalfHeight),
    };
    const existingBottomRight = {
        x: round(existingPoint.x + existingPointHalfWidth),
        y: round(existingPoint.y + existingPointHalfHeight),
    };
    const overlap = rectanglesOverlap(newTopLeft, newBottomRight, existingTopLeft, existingBottomRight);
    if (!overlap) return null;

    const calcXWithVx =
        vx > 0
            ? round(existingBottomRight.x + newPointHalfWidth + 1)
            : round(existingTopLeft.x - newPointHalfWidth - 1);
    const newPointWithVx = { x: calcXWithVx, y: round(newPoint.y + ((calcXWithVx - newPoint.x) * vy) / vx) };
    const calcYWithVy =
        vy > 0
            ? round(existingBottomRight.y + newPointHalfHeight + 1)
            : round(existingTopLeft.y - newPointHalfHeight - 1);
    const newPointWithVy = { x: round(newPoint.x + ((calcYWithVy - newPoint.y) * vx) / vy), y: calcYWithVy };
    const finalPoint =
        extent(newPointWithVx.x - newPoint.x, newPointWithVx.y - newPoint.y) >
        extent(newPointWithVy.x - newPoint.x, newPointWithVy.y - newPoint.y)
            ? newPointWithVy
            : newPointWithVx;
    // re-check (just for debugging)
    const newTopLeft2 = {
        x: round(finalPoint.x - newPointHalfWidth),
        y: round(finalPoint.y - newPointHalfHeight),
    };
    const newBottomRight2 = {
        x: round(finalPoint.x + newPointHalfWidth),
        y: round(finalPoint.y + newPointHalfHeight),
    };
    const overlap2 = rectanglesOverlap(newTopLeft2, newBottomRight2, existingTopLeft, existingBottomRight);
    if (overlap2) {
        console.error("New Calc didn't work", { ...newPoint, ...finalPoint }, existingPoint);
    }
    return finalPoint;
}

export function rectanglesOverlap(topLeft1: Point, bottomRight1: Point, topLeft2: Point, bottomRight2: Point) {
    // To check if either rectangle is actually a line
    // For example : l1 ={-1,0} r1={1,1} l2={0,-1} r2={0,1}
    if (
        topLeft1.x === bottomRight1.x ||
        topLeft1.y === bottomRight1.y ||
        topLeft2.x === bottomRight2.x ||
        topLeft2.y === bottomRight2.y
    ) {
        // the line cannot have positive overlap
        return false;
    }
    // If one rectangle is on left side of other then they don't overlap
    if (topLeft1.x >= bottomRight2.x || topLeft2.x >= bottomRight1.x) {
        return false;
    }
    // If one rectangle is above other
    if (bottomRight1.y <= topLeft2.y || bottomRight2.y <= topLeft1.y) {
        return false;
    }
    return true;
}
