import { useMemo } from "react";
import { useThree } from "react-three-fiber";
import { Vector3 } from "three";

export interface PositionedNode {
    name: string;
    width: number;
    height: number;
    depth: number;
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

// export function usePath(edges: PositionedEdge[]) {
//     const paths = useMemo(() => {
//         const edgeCurves = edges.map(edge => ({
//             edge,
//             curve: new CatmullRomCurve3(edge.points, false, "catmullrom")
//         }));
//         return groupBy(edgeCurves, e => `${e.edge.from}**${e.edge.to}`);
//     }, [edges]);
//     return paths;
// }
const viewPortDepth = -15;

// function scaleToFit(p: number, sourceMin: number, targetRange: number, scaleFactor: number) {
//     return (p - sourceMin) * scaleFactor + targetRange / -0.5;
// }

function scaleToFit3(p: Vector3, midGraph: Vector3, depth: number, scaleFactor: number) {
    return new Vector3(
        (p.x - midGraph.x) * scaleFactor, //- targetRange.x / 2,
        (p.y - midGraph.y) * scaleFactor, //- targetRange.y / 2,
        (p.z - midGraph.z) * scaleFactor - (depth * scaleFactor) / 2 //- targetRange.z
        // scaleToFit(p.x, minGraph.x, targetRange.x, scaleFactor),
        // scaleToFit(p.y, minGraph.y, targetRange.y, scaleFactor),
        // scaleToFit(p.z, minGraph.z, targetRange.z, scaleFactor)
    );
}

export function scalePoint(
    p: Vector3,
    graph: Layout,
    viewportWidth: number,
    viewportHeight: number,
    scaleFactor: number
) {
    // const targetRange = new Vector3(
    //     viewportWidth * scaleFactor,
    //     viewportHeight * scaleFactor,
    //     viewPortDepth * scaleFactor
    // );
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
    // const { viewport } = useThree();
    const scaleFactor = useScaleFactor(graph);
    // const viewPortRange = new Vector3(
    //     viewport.width, //* scaleFactor,
    //     viewport.height, //* scaleFactor,
    //     viewPortDepth //* scaleFactor
    // );
    const midGraph = new Vector3(
        (graph.width[1] + graph.width[0]) / 2,
        (graph.height[1] + graph.height[0]) / 2,
        (graph.depth[1] + graph.depth[0]) / 2
    );
    return useMemo<Layout>(() => {
        const nodes = graph.nodes.map<PositionedNode>(node => ({
            name: node.name,
            position: scaleToFit3(node.position, midGraph, graph.depth[1] - graph.depth[0], scaleFactor),
            width: node.width * scaleFactor, //, graph.width, viewport.width),
            height: node.height * scaleFactor, //, graph.height, viewport.height),
            depth: node.depth * scaleFactor //, graph.depth, viewPortDepth)
        }));
        const edges = graph.edges.map<PositionedEdge>(({ points, from, to }) => ({
            from: from,
            to: to,
            points: points.map(p => scaleToFit3(p, midGraph, graph.depth[1] - graph.depth[0], scaleFactor))
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
