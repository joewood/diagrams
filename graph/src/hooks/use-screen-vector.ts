import { useMemo } from "react";
import { Point, PositionedNode, ScreenPositionedNode, Size } from "./model";
import { rectanglesOverlapSize } from "./use-overlap";

function distanceBetween(origin: PositionedNode, test: PositionedNode) {
    if (origin === test) return { distance: 0, vx: 0, vy: 0 };
    const dx = test.virtualPos.x - origin.virtualPos.x;
    const dy = test.virtualPos.y - origin.virtualPos.y;
    const dp = dotProduct(dx, dy);
    return {
        distance: Math.sqrt(dx ** 2 + dy ** 2),
        vx: dp.x,
        vy: dp.y,
    };
}

function getScreenPosNode(
    origin: Pick<ScreenPositionedNode, "screenPosition" | "size">,
    node: PositionedNode,
    vx: number,
    vy: number,
    screenPositions: ScreenPositionedNode[],
    containerPadding: number
) {
    const widths = origin.size.width / 2 + node.size.width / 2 + containerPadding * 2;
    const heights = origin.size.height / 2 + node.size.height / 2 + containerPadding * 2;
    let distance = Math.sqrt(widths ** 2 + heights ** 2);
    while (true) {
        const newScreenPos = {
            x: origin.screenPosition.x + vx * distance,
            y: origin.screenPosition.y + vy * distance,
        };
        let [overlapX, overlapY] = [false, false];
        for (const existingNode of screenPositions) {
            const [newOverlapX, newOverlapY] = rectanglesOverlapSize(
                existingNode.screenPosition,
                existingNode.size,
                newScreenPos,
                node.size,
                containerPadding
            );
            overlapX ||= newOverlapX;
            overlapY ||= newOverlapY;
            // if any overlap then give up and increment the distance
            if (overlapX || overlapY) break;
        }
        if (!overlapX && !overlapY) {
            return {
                ...node,
                screenPosition: newScreenPos,
            } as ScreenPositionedNode;
        }
        distance += containerPadding;
    }
}

function dotProduct(x: number, y: number) {
    const d = Math.sqrt(x ** 2 + y ** 2);
    return { x: x / d, y: y / d };
}

export function useScreenNodesVectorMethod(
    screenPosition: Point,
    screenSize: Size,
    positionedNodes: PositionedNode[],
    sizeOverrides: Record<string, Size>,
    containerPadding: number,
    titlePadding: number
): [ScreenPositionedNode[], Size] {
    const screenRatio = dotProduct(screenSize.width, screenSize.height);
    const distances = useMemo(() => {
        const getNodeSize = (node: PositionedNode) => sizeOverrides[node.name] ?? node.size;
        const allPos = positionedNodes
            .flatMap((originNode) =>
                positionedNodes.map((testNode) => ({
                    origin: originNode,
                    test: testNode,
                    ...distanceBetween(originNode, testNode),
                }))
            )
            .filter(({ origin, test }) => origin !== test)
            .sort((a, b) => a.distance - b.distance);
        if (allPos.length === 0 && positionedNodes.length > 0) {
            return [{ origin: positionedNodes[0], test: positionedNodes[0], distance: 0, vx: 0, vy: 0 }];
        }
        if (positionedNodes.length === 2) {
            const twoNodeRatio = dotProduct(
                getNodeSize(positionedNodes[0]).width + getNodeSize(positionedNodes[1]).width,
                getNodeSize(positionedNodes[0]).height + getNodeSize(positionedNodes[1]).height
            );
            return twoNodeRatio.x > screenRatio.x
                ? allPos.map((p) => ({ ...p, vx: 0 }))
                : allPos.map((p) => ({ ...p, vy: 0 }));
        }
        return allPos;
    }, [positionedNodes, screenRatio.x, sizeOverrides]);

    const [screenPositions, newScreenSize] = useMemo(() => {
        if (positionedNodes.length === 0) return [[], { width: containerPadding * 2, height: containerPadding * 2 }];
        const getNodeSize = (node: PositionedNode) => sizeOverrides[node.name] ?? node.size;
        const screenPositioned: Record<string, ScreenPositionedNode> = {};
        const screenPositions: ScreenPositionedNode[] = [];
        const firstNode = getScreenPosNode(
            {
                screenPosition: {
                    x: screenSize.width / 2,
                    y: screenSize.height / 2,
                },
                size: { width: 1, height: 1 },
            },
            { ...distances[0].origin, size: getNodeSize(distances[0].origin) },
            1,
            1,
            screenPositions,
            containerPadding
        );
        screenPositioned[distances[0].origin.name] = firstNode;
        screenPositions.push(firstNode);
        while (screenPositions.length < positionedNodes.length) {
            for (const test of distances) {
                if (!screenPositioned[test.origin.name]) continue;
                if (!screenPositioned[test.test.name]) {
                    const newNode = getScreenPosNode(
                        screenPositioned[test.origin.name],
                        { ...test.test, size: getNodeSize(test.test) },
                        test.vx * screenRatio.x,
                        test.vy * screenRatio.y,
                        screenPositions,
                        containerPadding
                    );
                    screenPositioned[newNode.name] = newNode;
                    screenPositions.push(newNode);
                    break;
                }
            }
        }
        // find the extents of our new screen coordinated graph (it could be anyplace)
        const minX = Math.min(...screenPositions.map((x) => x.screenPosition.x - x.size.width / 2 - containerPadding));
        const maxX = Math.max(...screenPositions.map((x) => x.screenPosition.x + x.size.width / 2 + containerPadding));
        const minY = Math.min(...screenPositions.map((x) => x.screenPosition.y - x.size.height / 2 - containerPadding));
        const maxY = Math.max(...screenPositions.map((x) => x.screenPosition.y + x.size.height / 2 + containerPadding));
        // work out the width and height, if it's smaller than our space then we can place it in the middle
        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        // the adjustment is width difference divided by 2 (or 0 if negative), plus the screenPosition adjusted
        const possibleMarginX = Math.max(screenSize.width - graphWidth, 0) / 2;
        const adjustX = possibleMarginX + screenPosition.x - minX;
        const possibleMarginY = Math.max(screenSize.height - titlePadding - graphHeight, 0) / 2;
        const adjustY = possibleMarginY + screenPosition.y - minY + titlePadding;
        return [
            screenPositions.map((p) => ({
                ...p,
                screenPosition: { x: p.screenPosition.x + adjustX, y: p.screenPosition.y + adjustY },
            })),
            { width: graphWidth + containerPadding * 2, height: graphHeight + titlePadding + containerPadding },
        ];
    }, [
        containerPadding,
        distances,
        positionedNodes.length,
        screenPosition.x,
        screenPosition.y,
        screenRatio.x,
        screenRatio.y,
        screenSize.height,
        screenSize.width,
        sizeOverrides,
        titlePadding,
    ]);
    return [screenPositions, newScreenSize];
}
