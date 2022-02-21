import { useMemo } from "react";
import { PositionedNode, Size, Point, ScreenPositionedNode } from "./model";

export function useScreenScale(
    screenSize: Size,
    positionedNodes: PositionedNode[],
    sizeOverride: Record<string, Size>,
    textSize: number
) {
    // get the containing rectangle
    return useMemo(() => {
        return calculateScreenScale(positionedNodes, screenSize, sizeOverride, textSize);
    }, [positionedNodes, screenSize, sizeOverride, textSize]);
}

export function useScreenNodes(
    nodes: PositionedNode[],
    parentVirtualPosition: Point,
    rx: number,
    ry: number,
    targetPosition: Point,
    sizeOverrides: Record<string, Size>,
    padding: number
): ScreenPositionedNode[] {
    return useMemo<ReturnType<typeof useScreenNodes>>(() => {
        const screenNodes = nodes.map((node) => {
            const screenPosition = adjustPosition(node.virtualPos, parentVirtualPosition, rx, ry, targetPosition, 0);
            return {
                ...node,
                screenPosition,
                parentScreenPosition: targetPosition,
                size: sizeOverrides[node.name] ?? node.size,
            };
        });
        return screenNodes;
    }, [nodes, parentVirtualPosition, rx, ry, sizeOverrides, targetPosition]);
}

/** Calculates the containing rectangle of a set of Nodes */

function calculateScreenScale(
    nodes: PositionedNode[],
    screenSize: Size,
    sizeOverride: Record<string, Size>,
    containerPadding: number
): [Point, number, number] {
    const getSize = (node: PositionedNode) => sizeOverride[node.name] ?? node.size;
    const halfWidth = (node: PositionedNode) => getSize(node).width / 2 + containerPadding;
    const halfHeight = (node: PositionedNode) => getSize(node).height / 2 + containerPadding;

    /** Fitness of how well our ratio fits the graph in the space.
     * @returns How much it overlaps the bounds. We want this to be <0.    */
    function fitnessTest(nodes: PositionedNode[], screenArea: Size, rx: number, ry: number): [number, number] {
        const testScreenWidth =
            Math.max(...nodes.map((n) => n.virtualPos.x * rx + halfWidth(n))) -
            Math.min(...nodes.map((n) => n.virtualPos.x * rx - halfWidth(n)));
        const testScreenHeight =
            Math.max(...nodes.map((n) => n.virtualPos.y * ry + halfHeight(n))) -
            Math.min(...nodes.map((n) => n.virtualPos.y * ry - halfHeight(n)));
        return [testScreenWidth / screenArea.width, testScreenHeight / screenArea.height];
    }
    if (nodes.length < 2)
        return [
            { x: nodes[0].virtualPos.x - halfWidth(nodes[0]), y: nodes[0].virtualPos.y - halfHeight(nodes[0]) },
            1,
            1,
        ];
    // we start guessing the 'R' value by getting the distance between the mid - points
    const distanceX = Math.max(...nodes.map((n) => n.virtualPos.x)) - Math.min(...nodes.map((n) => n.virtualPos.x));
    const distanceY = Math.max(...nodes.map((n) => n.virtualPos.y)) - Math.min(...nodes.map((n) => n.virtualPos.y));

    // don't both if any of the nodes are bigger than the screenSize
    const maxWidth = Math.max(...nodes.map((n) => n.size.width + 2 * containerPadding));
    const maxHeight = Math.max(...nodes.map((n) => n.size.height + 2 * containerPadding));

    let scaleX = screenSize.width / Math.max(distanceX, nodes[0].size.width);
    let scaleY = screenSize.height / Math.max(distanceY, nodes[0].size.height);
    if (maxWidth >= screenSize.width) scaleX = 0;
    if (maxHeight >= screenSize.height) scaleY = 0;
    let index = 0;
    const maxAttempts = 400;
    do {
        const [fitnessX, fitnessY] = fitnessTest(nodes, screenSize, scaleX, scaleY);
        if (fitnessX > 1 && scaleX !== 0) scaleX = scaleX * 0.95;
        if (fitnessY > 1 && scaleY !== 0) scaleY = scaleY * 0.95;
        if ((fitnessX <= 1 || scaleX === 0) && (fitnessY <= 1 || scaleY === 0)) {
            break;
        }
        if (index >= maxAttempts) {
            console.log(
                `FITTING ${index} ${fitnessX} rx:${scaleX} ${fitnessY} ry:${scaleY} nodes:${nodes
                    .map((n) => JSON.stringify(n.virtualPos))
                    .join(",")} screen:${JSON.stringify(screenSize)}`
            );
        }
        index++;
    } while (index <= maxAttempts);
    const x1 = scaleX === 0 ? 0 : Math.min(...nodes.map((n) => n.virtualPos.x - halfWidth(n) / scaleX));
    const y1 = scaleY === 0 ? 0 : Math.min(...nodes.map((n) => n.virtualPos.y - halfHeight(n) / scaleY));
    return [{ x: x1, y: y1 }, scaleX, scaleY] as [Point, number, number];
}

export function adjustPosition(
    virtualPoint: Point,
    virtualTopLeft: Point,
    scaleX: number,
    scaleY: number,
    screenPosition?: Point,
    paddingScreen = 0
) {
    return {
        x: (virtualPoint.x - virtualTopLeft.x) * scaleX + (screenPosition?.x ?? 0) + paddingScreen,
        y: (virtualPoint.y - virtualTopLeft.y) * scaleY + (screenPosition?.y ?? 0) + paddingScreen,
    };
}
