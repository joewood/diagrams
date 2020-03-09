import { useMemo } from "react";
import { useThree } from "react-three-fiber";
import { Vector3 } from "three";

export interface PositionedNode {
    name: string;
    width: number;
    height: number;
    type: string;
    depth: number;
    position: Vector3;
}

export interface PositionedEdge {
    name?: string;
    messages?: number;
    from: string;
    to: string;
    edgePoints: Vector3[];
}

export type MinMax = [number, number];

export interface Layout {
    nodes: PositionedNode[];
    edges: PositionedEdge[];
    width: MinMax;
    height: MinMax;
    depth: MinMax;
}

const viewPortDepth = -15;

function scaleToFit3(p: Vector3, midGraph: Vector3, depth: number, scaleFactor: number) {
    return new Vector3(
        (p.x - midGraph.x) * scaleFactor,
        (p.y - midGraph.y) * scaleFactor,
        (p.z - midGraph.z) * scaleFactor - (depth * scaleFactor) / 2
    );
}

export function scalePoint(
    p: Vector3,
    graph: Layout,
    viewportWidth: number,
    viewportHeight: number,
    scaleFactor: number
) {
    const midGraph = new Vector3(
        (graph.width[1] + graph.width[0]) / 2,
        (graph.height[1] + graph.height[0]) / 2,
        (graph.depth[1] + graph.depth[0]) / 2
    );
    return scaleToFit3(p, midGraph, graph.depth[1] - graph.depth[0], scaleFactor);
}

export function useScaleFactor(graph: Layout) {
    const { viewport } = useThree();
    const width = graph.width[1] - graph.width[0];
    const height = graph.height[1] - graph.height[0];
    const depth = graph.depth[1] - graph.depth[0];
    return useMemo(() => {
        const maxGraph = Math.max(width, height, depth);
        const minScreen = Math.min(viewport.height, viewport.width);
        return minScreen / maxGraph;
    }, [width, height, depth, viewport.height, viewport.width]);
}

export function useGraphViewPort(graph: Layout): Layout {
    const scaleFactor = useScaleFactor(graph);
    const midGraph = new Vector3(
        (graph.width[1] + graph.width[0]) / 2,
        (graph.height[1] + graph.height[0]) / 2,
        (graph.depth[1] + graph.depth[0]) / 2
    );
    return useMemo<Layout>(() => {
        const nodes = graph.nodes.map<PositionedNode>(node => ({
            name: node.name,
            type: node.type,
            position: scaleToFit3(node.position, midGraph, graph.depth[1] - graph.depth[0], scaleFactor),
            width: node.width * scaleFactor, //, graph.width, viewport.width),
            height: node.height * scaleFactor, //, graph.height, viewport.height),
            depth: node.depth * scaleFactor //, graph.depth, viewPortDepth)
        }));
        const edges = graph.edges.map<PositionedEdge>(({ edgePoints: points, from, to }) => ({
            from: from,
            to: to,
            edgePoints: points.map(p => scaleToFit3(p, midGraph, graph.depth[1] - graph.depth[0], scaleFactor))
        }));
        const width = (graph.width[1] - graph.width[0]) * scaleFactor; //, graph.width, viewport.width);
        const height = (graph.height[1] - graph.height[0]) * scaleFactor; //, graph.height, viewport.height);
        return {
            width: [width * -0.5, width * 0.5],
            height: [height * 0.5, height * 0.5],
            nodes,
            edges,
            depth: [viewPortDepth, -1]
        };
    }, [scaleFactor, midGraph, graph]);
}
