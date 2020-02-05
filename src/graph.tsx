import { graphlib, layout } from "dagre"
import React, { FC, useCallback, useMemo, useState } from 'react'
import { useThree } from 'react-three-fiber'
import { CatmullRomCurve3, Vector3 } from "three"
import { CameraRig } from "./camera-rig"
import { SpinText } from "./spin-text"

interface Node {
	name: string;
	width: number;
	height: number;
}

interface Edge {
	from: string;
	to: string;
}

interface PositionedNode {
	name: string;
	width: number;
	height: number;
	x: number;
	y: number;
}

interface PositionedEdge {
	name?: string;
	points: { x: number, y: number }[]
}

interface Layout {
	nodes: PositionedNode[];
	edges: PositionedEdge[];
	width: [number, number];
	height: [number, number];
}

export function useDag(nodes: Node[], edges: Edge[], direction = "LR"): Layout {
	return useMemo(() => {
		const g = new graphlib.Graph({ directed: true });
		g.setGraph({ rankdir: direction, edgesep: 2, marginx: 20, marginy: 20 });
		g.setDefaultEdgeLabel(() => { return {} });
		for (const node of nodes) {
			g.setNode(node.name, { label: node.name, width: node.width, height: node.height });
		}
		for (const edge of edges) {
			g.setEdge(edge.from, edge.to, { minlen: 1 });
		}
		layout(g);
		const retnodes = g.nodes().map(n => ({ name: n, width: g.node(n).width, height: g.node(n).height, x: g.node(n).x, y: g.node(n).y }));
		const width = retnodes.reduce((p, c) => [Math.min(c.x, p[0]), Math.max(c.x + c.width, p[1])], [0, 0]) as [number, number]
		const height = retnodes.reduce((p, c) => [Math.min(c.y, p[0]), Math.max(c.y + c.height, p[1])], [0, 0]) as [number, number]
		const retedges = g.edges().map(e => ({ points: g.edge(e).points }));
		return { nodes: retnodes, width, height, edges: retedges }
	}, [nodes, edges, direction])
}

// extend({ OrbitControls })

// function Controls() {
// 	const controls = useRef() as any //Ref<ReactThreeFiber.Object3DNode<OrbitControls,typeof OrbitControls>>
// 	const { camera, gl } = useThree()
// 	useFrame(() => controls && controls.current && controls.current.update())
// 	return (
// 		<orbitControls ref={controls} args={[camera, gl.domElement]} enableDamping dampingFactor={0.1} rotateSpeed={0.5} />
// 	)
// }


interface GraphProps {
	graph: Layout;
}

export const Graph: FC<GraphProps> = ({ graph }) => {
	const { viewport } = useThree();
	const convertGraphX = useCallback((x: number) => (x - graph.width[0]) * (viewport.width) / (graph.width[1] - graph.width[0]) - viewport.width / 2, [viewport, graph])
	const convertGraphY = useCallback((y: number) => (y - graph.height[0]) * (viewport.height) / (graph.height[1] - graph.height[0]) - viewport.height / 2, [graph, viewport])
	const convertWidth = useCallback((width: number) => width * viewport.width / (graph.width[1] - graph.width[0]), [viewport, graph])
	const convertHeight = useCallback((height: number) => height * viewport.height / (graph.height[1] - graph.height[0]), [viewport, graph])
	const [selectedNode, selectNode] = useState(0)
	const points = useMemo(() => {
		return graph.nodes.map(n => new Vector3(convertGraphX(n.x), convertGraphY(n.y), -0.1))
	}, [graph, convertGraphX, convertGraphY])
	const onSelect = useCallback(({ text }: { text: string }) => {
		const index = graph.nodes.findIndex(f => f.name === text);
		if (index >= 0) selectNode(index);
	}, [graph, selectNode])
	return <>
		<CameraRig targetPosition={points[selectedNode]} />
		{
			graph.nodes.map((n, i) => (<SpinText
				key={n.name + selectedNode}
				onClick={onSelect}
				text={n.name}
				spinX={n.name === "Client" || n.name === "Config" ? 0.6 : 0}
				color={i === selectedNode ? "black" : "white"}
				width={convertWidth(n.width)}
				height={convertHeight(n.height)}
				backgroundColor="#4070f0"
				depth={0.3}
				position={[convertGraphX(n.x), convertGraphY(n.y), -0.1]} />))
		}
		{graph.edges.map(edge => {
			const path = new CatmullRomCurve3(edge.points.map(point => new Vector3(convertGraphX(point.x), convertGraphY(point.y), -0.1)), false, "catmullrom")
			return (<mesh >
				<tubeGeometry
					attach="geometry"
					args={[path, 30, 0.03, 8, false]}
				/>
				<meshPhongMaterial attach="material" color="#606010" />
			</mesh>);
		})}
	</>

}


