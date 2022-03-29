import { useColorModeValue } from "@chakra-ui/react";
import { useMemo } from "react";
import { Point, PositionedNode, ScreenPositionedNode, Size } from "./model";
import { rectanglesOverlapSize } from "./use-overlap";

/** Pythagoras to calculate the distance from the origin to x,y */
export function extent(x: number, y: number) {
    return Math.sqrt(x ** 2 + y ** 2);
}

export function unitVector(x: number, y: number) {
    const distance = extent(x, y);
    return { x: x / distance, y: y / distance };
}

function directBetweenNodes(origin: PositionedNode, test: PositionedNode) {
    if (origin === test) return { distance: 0, vx: 0, vy: 0 };
    const dx = test.virtualPos.x - origin.virtualPos.x;
    const dy = test.virtualPos.y - origin.virtualPos.y;
    const dp = unitVector(dx, dy);
    return {
        distance: extent(dx, dy),
        vx: dp.x,
        vy: dp.y,
    };
}

function getScreenPosNode(
    origin: Point & Size,
    node: PositionedNode,
    vx: number,
    vy: number,
    screenPositions: (Point & Size)[],
    nodeMargin: number
): Point & Size {
    let screenPosition = { ...origin, ...node.size };
    let n = 0;
    if (screenPositions.length === 0) {
        return screenPosition;
    }
    let overlapping: (Point & Size) | null = null;
    while (n < screenPositions.length * 100) {
        let overlapped = false;
        n++;
        for (const existingNode of screenPositions) {
            const newScreenPos = rectanglesOverlapSize(existingNode, screenPosition, nodeMargin, vx, vy);
            if (!!newScreenPos) {
                overlapped = true;
                overlapping = existingNode;
                screenPosition = { ...screenPosition, ...newScreenPos };
                break;
            }
        }
        if (!overlapped) return screenPosition;
    }
    console.log(`END ${n} vx:${vx},vy:${vy}`, overlapping, screenPosition);
    console.log(`END-2 ${screenPositions.length} vx:${vx},vy:${vy} ${JSON.stringify(screenPositions, null, 2)}`);
    return screenPosition;
}

function useNodeDirections(positionedNodes: PositionedNode[], screenRatioX: number) {
    return useMemo(() => {
        const getNodeSize = (node: PositionedNode) => node.size;
        const allPos = positionedNodes
            .flatMap((originNode) =>
                positionedNodes.map((testNode) => ({
                    origin: originNode,
                    test: testNode,
                    ...directBetweenNodes(originNode, testNode),
                }))
            )
            .filter(({ origin, test }) => origin !== test)
            .sort((a, b) => a.distance - b.distance);
        if (allPos.length === 0 && positionedNodes.length > 0) {
            return [{ origin: positionedNodes[0], test: positionedNodes[0], distance: 0, vx: 0, vy: 0 }];
        }
        if (positionedNodes.length === 2) {
            const twoNodeRatio = unitVector(
                getNodeSize(positionedNodes[0]).width + getNodeSize(positionedNodes[1]).width,
                getNodeSize(positionedNodes[0]).height + getNodeSize(positionedNodes[1]).height
            );
            return twoNodeRatio.x > screenRatioX
                ? allPos.map((p) => ({ ...p, vx: 0 }))
                : allPos.map((p) => ({ ...p, vy: 0 }));
        }
        return allPos;
    }, [positionedNodes, screenRatioX]);
}

export function useScreenNodesVectorMethod(
    screenPosition: Point,
    positionedNodes: PositionedNode[],
    nodeMargin: number,
    titlePadding: number
): [ScreenPositionedNode[], Size] {
    const screenRatio = unitVector(100, 100);
    const nodeDirections = useNodeDirections(positionedNodes, screenRatio.x);
    const possDict = useMemo<Record<string, Point & Size>>(() => {
        if (positionedNodes.length === 0) return {}; //{ width: containerPadding * 2, height: containerPadding * 2 }];
        const screenPositioned: Record<string, Point & Size> = {};
        const screenPositions: (Point & Size)[] = [];
        const firstNode = getScreenPosNode(
            { x: 0, y: 0, width: nodeMargin, height: nodeMargin },
            { ...nodeDirections[0].origin },
            1,
            1,
            screenPositions,
            nodeMargin
        );
        screenPositioned[nodeDirections[0].origin.name] = firstNode;
        screenPositions.push(firstNode);
        while (screenPositions.length < positionedNodes.length) {
            for (const nodeDir of nodeDirections) {
                if (!screenPositioned[nodeDir.origin.name]) continue;
                if (!screenPositioned[nodeDir.test.name]) {
                    const newPos = getScreenPosNode(
                        screenPositioned[nodeDir.origin.name],
                        { ...nodeDir.test },
                        nodeDir.vx * screenRatio.x,
                        nodeDir.vy * screenRatio.y,
                        screenPositions,
                        nodeMargin
                    );
                    screenPositioned[nodeDir.test.name] = newPos;
                    screenPositions.push(newPos);
                    break;
                }
            }
        }
        return screenPositioned;
    }, [positionedNodes.length, nodeMargin, nodeDirections, screenRatio.x, screenRatio.y]);

    const [screenPositions, newScreenSize] = useMemo(() => {
        const poss = Object.values(possDict);
        // find the extents of our new screen coordinated graph (it could be anyplace)
        const minX = poss.length === 0 ? 0 : Math.min(...poss.map((p) => p.x - p.width / 2));
        const maxX = poss.length === 0 ? 0 : Math.max(...poss.map((p) => p.x + p.width / 2));
        const minY = poss.length === 0 ? 0 : Math.min(...poss.map((p) => p.y - p.height / 2));
        const maxY = poss.length === 0 ? 0 : Math.max(...poss.map((p) => p.y + p.height / 2));
        // work out the width and height, if it's smaller than our space then we can place it in the middle
        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        // the adjustment is width difference divided by 2 (or 0 if negative), plus the screenPosition adjusted
        const adjustX = screenPosition.x - minX + nodeMargin;
        const adjustY = screenPosition.y - minY + titlePadding;
        return [
            positionedNodes.map<ScreenPositionedNode>((p) => ({
                ...p,
                parentScreenPosition: screenPosition,
                size: { width: possDict[p.name].width, height: possDict[p.name].height },
                color: p.color!,
                screenPosition: { x: possDict[p.name].x + adjustX, y: possDict[p.name].y + adjustY },
            })),
            { width: graphWidth + nodeMargin * 2, height: graphHeight + titlePadding + nodeMargin },
        ];
    }, [nodeMargin, positionedNodes, possDict, screenPosition, titlePadding]);
    return [screenPositions, newScreenSize];
}
