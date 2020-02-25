import { groupBy } from "lodash";
import { useMemo } from "react";
import { useThree } from "react-three-fiber";
import { CatmullRomCurve3, Vector3 } from "three";

export interface PositionedNode {
    name: string;
    width?: number;
    height?: number;
    depth?: number;
    position: Vector3;
}

export interface PositionedEdge {
    name?: string;
    messages?: number;
    from: string;
    to: string;
    points: Vector3[];
}

export type MinMax = [number, number];

export interface Layout {
    nodes: PositionedNode[];
    edges: PositionedEdge[];
    width: MinMax;
    height: MinMax;
    depth: MinMax;
}

export function usePath(edges: PositionedEdge[]) {
    const paths = useMemo(() => {
        const edgeCurves = edges.map(edge => ({
            edge,
            curve: new CatmullRomCurve3(edge.points, false, "catmullrom")
        }));
        return groupBy(edgeCurves, e => `${e.edge.from}**${e.edge.to}`);
    }, [edges]);
    return paths;
}

function scaleToFit(p: number, sourceRange: MinMax, targetRange: MinMax) {
    return (
        ((p - sourceRange[0]) * (targetRange[1] - targetRange[0])) / (sourceRange[1] - sourceRange[0]) + targetRange[0]
    );
}

function scaleToFit3(
    p: Vector3,
    sourceRange: { x: MinMax; y: MinMax; z: MinMax },
    targetRange: { x: number; y: number; z: number }
) {
    return new Vector3(
        scaleToFit(p.x, sourceRange.x, [-0.5 * targetRange.x, 0.5 * targetRange.x]),
        scaleToFit(p.y, sourceRange.y, [-0.5 * targetRange.y, 0.5 * targetRange.y]),
        scaleToFit(p.z, sourceRange.z, [targetRange.z - 2, -2])
    );
}

function scaleRangeToFit(r: number, sourceRange: [number, number], targetRange: number) {
    return (r * targetRange) / (sourceRange[1] - sourceRange[0]);
}

export function useGraphViewPort(graph: Layout): Layout {
    const { viewport } = useThree();
    const viewPortDepth = -5;
    return useMemo<Layout>(() => {
        const nodes = graph.nodes.map<PositionedNode>(n => ({
            name: n.name,
            position: scaleToFit3(
                n.position,
                {
                    x: graph.width,
                    y: graph.height,
                    z: graph.depth
                },
                {
                    x: viewport.width,
                    y: viewport.height,
                    z: viewPortDepth
                }
            ),
            width: scaleRangeToFit(n.width || 10, graph.width, viewport.width),
            height: scaleRangeToFit(n.height || 10, graph.height, viewport.height),
            depth: scaleRangeToFit(n.width || 10, graph.depth, viewPortDepth)
        }));
        const edges = graph.edges.map<PositionedEdge>(({ points, from, to }) => ({
            from: from,
            to: to,
            points: points.map(p =>
                scaleToFit3(
                    p,
                    {
                        x: graph.width,
                        y: graph.height,
                        z: graph.depth
                    },
                    {
                        x: viewport.width,
                        y: viewport.height,
                        z: viewPortDepth
                    }
                )
            )
        }));
        const width = scaleRangeToFit(graph.width[1] - graph.width[0], graph.width, viewport.width);
        const height = scaleRangeToFit(graph.height[1] - graph.height[0], graph.height, viewport.height);
        return {
            width: [width / -2, width / 2],
            height: [height / -2, height / 2],
            nodes,
            edges,
            depth: [viewPortDepth, 0]
        };
    }, [viewPortDepth, viewport.width, viewport.height, graph]);
}
