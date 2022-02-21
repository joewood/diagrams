import { useEffect } from "react";
import { MiniGraphProps } from "..";
import { Point, ScreenRect, Size } from "./model";

export function useOverlap(
    name: string,
    onResizeNeeded: MiniGraphProps["onResizeNeeded"],
    rectangleMargin: number,
    rectangles: ScreenRect[],
    screenPosition: Point,
    screenSize: Size
) {
    // notify parent graph that a node has been changed
    useEffect(() => {
        const maxWidth = Math.max(screenSize.width, ...rectangles.map((p) => p.size.width + 2 * rectangleMargin));
        const maxHeight = Math.max(screenSize.height, ...rectangles.map((p) => p.size.height + 2 * rectangleMargin));

        if (maxWidth > screenSize.width || maxHeight > screenSize.height) {
            console.log("Suggested new Size " + JSON.stringify(screenSize), maxWidth, maxHeight);
            onResizeNeeded(name, {
                overlappingX: true,
                overlappingY: true,
                suggestedSize: {
                    width: maxWidth,
                    height: maxHeight,
                },
            });
            return;
        }
        const [overlappingX, overlappingY, paddedOverlappingX, paddedOverlappingY] = getOverlap(
            rectangles,
            rectangleMargin
            // screenPosition,
            // screenSize
        );
        if (overlappingX || overlappingY || !paddedOverlappingX || !paddedOverlappingY) {
            const t = setTimeout(
                () =>
                    onResizeNeeded(name, {
                        overlappingX,
                        overlappingY,
                        shrinkingX: !paddedOverlappingX,
                        shrinkingY: !paddedOverlappingY,
                    }),
                1
            );
            return () => clearTimeout(t);
        }
    }, [name, onResizeNeeded, rectangleMargin, rectangles, screenPosition, screenSize]);
}

function rectanglesOverlap(topLeft1: Point, bottomRight1: Point, topLeft2: Point, bottomRight2: Point) {
    // To check if either rectangle is actually a line
    // For example : l1 ={-1,0} r1={1,1} l2={0,-1} r2={0,1}
    let [overlapX, overlapY] = [false, false];
    if (
        topLeft1.x === bottomRight1.x ||
        topLeft1.y === bottomRight1.y ||
        topLeft2.x === bottomRight2.x ||
        topLeft2.y === bottomRight2.y
    ) {
        // the line cannot have positive overlap
        return [false, false];
    }
    // If one rectangle is on left side of other then they don't overlap
    if (topLeft1.x >= bottomRight2.x || topLeft2.x >= bottomRight1.x) {
        return [false, false];
    } else {
        overlapX = true;
    }
    // If one rectangle is above other
    if (bottomRight1.y <= topLeft2.y || bottomRight2.y <= topLeft1.y) {
        return [false, false];
    } else {
        overlapY = true;
    }
    return [overlapX, overlapY];
}

/** Tests a set of rectangles if they overlap
 * @param rectangles - set of rectangles to test
 * @param rectangleMargin - padding around the rectangle
 * @param screenPosition - bounding container
 * @param screenSize - bounding container
 * @returns overlapX, overlapY, overlapWidePaddingX, overlapWidePaddingY
 */
export function getOverlap(
    rectangles: ScreenRect[],
    rectangleMargin: number
    // screenPosition: Point,
    // screenSize: Size
): [boolean, boolean, boolean, boolean] {
    let overlapInMarginX = false;
    let overlapInMarginY = false;
    // we also check for overlap for larger shapes to see if we can shrink the space
    // if none of the shapes are overlapping with a padded size then we can shrink
    let overlapWideMarginX = false;
    let overlapWideMarginY = false;
    const veryWideMargin = rectangleMargin * 3;
    // overlap logic only applies if there are >=2 rectangles
    if (rectangles.length < 2) return [false, false, true, true];
    for (const rectangle1 of rectangles) {
        const rect1 = { ...rectangle1.screenPosition, ...rectangle1.size };
        for (const rectangle2 of rectangles) {
            if (rectangle2 === rectangle1) continue;
            const rect2 = { ...rectangle2.screenPosition, ...rectangle2.size };
            const [newOverlapX, newOverlapY] = rectanglesOverlap(
                {
                    x: rect1.x - rect1.width / 2 - rectangleMargin,
                    y: rect1.y - rect1.height / 2 - rectangleMargin,
                },
                {
                    x: rect1.x + rect1.width / 2 + rectangleMargin,
                    y: rect1.y + rect1.height / 2 + rectangleMargin,
                },
                {
                    x: rect2.x - rect2.width / 2 - rectangleMargin,
                    y: rect2.y - rect2.height / 2 - rectangleMargin,
                },
                {
                    x: rect2.x + rect2.width / 2 + rectangleMargin,
                    y: rect2.y + rect2.height / 2 + rectangleMargin,
                }
            );
            overlapInMarginX ||= newOverlapX;
            overlapInMarginY ||= newOverlapY;
            // we test if there's any overlap with a padding around the rec
            // if there's no overlap then we can probably shrink the targetArea
            const [newPaddedOverlapX, newPaddedOverlapY] = rectanglesOverlap(
                {
                    x: rect1.x - rect1.width / 2 - veryWideMargin,
                    y: rect1.y - rect1.height / 2 - veryWideMargin,
                },
                {
                    x: rect1.x + rect1.width / 2 + veryWideMargin,
                    y: rect1.y + rect1.height / 2 + veryWideMargin,
                },
                {
                    x: rect2.x - rect2.width / 2 - veryWideMargin,
                    y: rect2.y - rect2.height / 2 - veryWideMargin,
                },
                {
                    x: rect2.x + rect2.width / 2 + veryWideMargin,
                    y: rect2.y + rect2.height / 2 + veryWideMargin,
                }
            );
            overlapWideMarginX ||= newPaddedOverlapX;
            overlapWideMarginY ||= newPaddedOverlapY;
            // if any overlap, then we need to grow the target area. Quit.
            if (overlapInMarginX && overlapInMarginY) break;
        }
        if (overlapInMarginX && overlapInMarginY) break;
    }
    return [overlapInMarginX, overlapInMarginY, overlapWideMarginX, overlapWideMarginY];
}
