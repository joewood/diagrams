import { graphlib, layout } from "dagre"
import React, { FC, useMemo, useRef, Ref, useState, useCallback } from 'react'
import { Canvas, useThree, extend, ReactThreeFiber, useFrame } from 'react-three-fiber'
import { Text } from "./text"
import { SpinText } from "./spin-text"
import { Vector3, Mesh, CurvePath, Curve, CatmullRomCurve3, Color, Colors, Vector } from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

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

function useDag(nodes: Node[], edges: Edge[], direction = "LR"): Layout {
	return useMemo(() => {
		const g = new graphlib.Graph({ directed: true });
		g.setGraph({ rankdir: direction, edgesep: 2, marginx: 20, marginy: 20 });
		g.setDefaultEdgeLabel(() => { return {} });
		for (const node of nodes) {
			g.setNode(node.name, { label: node.name, width: node.width, height: node.height });
		}

		for (const edge of edges) {
			// Add edges to the graph.
			g.setEdge(edge.from, edge.to, { minlen: 1 });
		}
		layout(g);
		const retnodes = g.nodes().map(n => ({ name: n, width: g.node(n).width, height: g.node(n).height, x: g.node(n).x, y: g.node(n).y }));
		const width = retnodes.reduce((p, c) => [Math.min(c.x, p[0]), Math.max(c.x + c.width, p[1])], [0, 0]) as [number, number]
		const height = retnodes.reduce((p, c) => [Math.min(c.y, p[0]), Math.max(c.y + c.height, p[1])], [0, 0]) as [number, number]
		const retedges = g.edges().map(e => ({ points: g.edge(e).points }));
		return { nodes: retnodes, width, height, edges: retedges }
	}, [nodes, edges])
}

extend({ OrbitControls })

function Controls() {
	const controls = useRef() as any //Ref<ReactThreeFiber.Object3DNode<OrbitControls,typeof OrbitControls>>
	const { camera, gl } = useThree()
	useFrame(() => controls && controls.current && controls.current.update())
	return (
		<orbitControls ref={controls} args={[camera, gl.domElement]} enableDamping dampingFactor={0.1} rotateSpeed={0.5} />
	)
}

function useSelectedNode(points: any[]) {
	const [index, setIndex] = useState(0);
	const cb = useCallback(({ clock }: any) => {
		const time = clock.getElapsedTime() / 2
		const index = Math.floor(time) % points.length;
		setIndex(index);
	}, [points])
	useFrame(cb);
	return index;
}

function useCameraPan(points: Vector3[]) {
	const { camera } = useThree();
	const [camPos, setCamPos] = useState({ pos: { x: 0, y: 0, z: 4 }, vel: { x: 0, y: 0, z: 0 } })
	const [camLooKAt, setCamLookAt] = useState([0, 0, -1])
	const cb = useCallback(({ clock }: any) => {
		const time = clock.getElapsedTime() / 2
		const index = Math.floor(time) % points.length;
		const next = (index + 1) % points.length;
		const secFraction = time - Math.floor(time);

		setCamPos(pos => ({
			vel: {
				x: ((points[index].x - pos.pos.x) * 0.002 + pos.vel.x) * 0.95,
				y: ((points[index].y - pos.pos.y) * 0.002 + pos.vel.y) * 0.95,
				z: 0//Math.sin(secFraction * 2 * Math.PI) / 500
			},
			pos: {
				x: pos.pos.x + pos.vel.x,
				y: pos.pos.y + pos.vel.y,
				z: pos.pos.z + pos.vel.z
			}
		}));
		setCamLookAt(pos => [(points[next].x - pos[0]) * 0.002 + pos[0], (points[next].y - pos[1]) * 0.002 + pos[1], pos[2]])
	}, [points])
	useFrame(cb);
	camera.position.set(camPos.pos.x, camPos.pos.y, camPos.pos.z)
	camera.lookAt(new Vector3(camPos.pos.x + camPos.vel.x * 3, camPos.pos.y + camPos.vel.y * 3, camLooKAt[2]))
	return [camPos.pos.x, camPos.pos.y, camPos.pos.z];
}

function Cam({ points }: { points: Vector3[] }) {
	const pos = useCameraPan(points);
	return <camera attach="camera" position={pos} />
}


interface GraphProps {
	graph: Layout;
}
const Graph: FC<GraphProps> = ({ graph }) => {
	const { viewport, size } = useThree();
	const convertGraphX = (x: number) => (x - graph.width[0]) * (viewport.width) / (graph.width[1] - graph.width[0]) - viewport.width / 2
	const convertGraphY = (y: number) => (y - graph.height[0]) * (viewport.height) / (graph.height[1] - graph.height[0]) - viewport.height / 2
	const convertWidth = (width: number) => width * viewport.width / (graph.width[1] - graph.width[0])
	const convertHeight = (height: number) => height * viewport.height / (graph.height[1] - graph.height[0])
	const selectedNode = useSelectedNode(graph.nodes)
	const points = useMemo(() => {
		return graph.nodes.map(n => new Vector3(convertGraphX(n.x), convertGraphY(n.y), -0.1))
	}, [graph])
	console.log({ selectedNode })
	return <>
		<Cam points={points} />
		{
			graph.nodes.map((n, i) => (<Text
				key={n.name + selectedNode}
				text={n.name}
				color={i === selectedNode ? "black" : "white"}
				width={convertWidth(n.width)}
				height={convertHeight(n.height)}
				depth={0.2}
				position={[convertGraphX(n.x), convertGraphY(n.y), -0.1]} />))
		}
		{graph.edges.map(edge => {
			const path = new CatmullRomCurve3(edge.points.map(point => new Vector3(convertGraphX(point.x), convertGraphY(point.y), -0.1)), false, "catmullrom")
			return (<mesh >
				<tubeGeometry
					attach="geometry"
					args={[path, 30, 0.03, 8, false]}
				/>
				<meshPhongMaterial attach="material" color="grey" />
			</mesh>);
		})}
	</>

}


export default function App() {
	const height = 6;
	const width = 50;
	const vwapEngine = "VWAP Engine"
	const oms = "OMS"
	const market = "Exch Links"
	const trading = "Trading Sys"
	const prices = "MD Sys"
	const client = "Client"
	const clientSys = "Client Int"
	const graph = useDag([
		{ name: "Config", width, height },
		{ name: "Ref Data Svc", width, height },
		{ name: "EOD Prices", width, height },
		{ name: prices, width, height },
		{ name: client, width, height },
		{ name: clientSys, width, height },
		{ name: vwapEngine, width, height },
		{ name: oms, width, height },
		{ name: market, width, height },
		{ name: trading, width, height }
	], [
		{ from: "Config", to: vwapEngine },
		{ from: client, to: clientSys },
		{ from: clientSys, to: oms },
		{ from: "Ref Data Svc", to: vwapEngine },
		{ from: prices, to: vwapEngine },
		{ from: "EOD Prices", to: vwapEngine },
		{ from: vwapEngine, to: oms },
		{ from: oms, to: market },
		{ from: market, to: trading },
		{ from: trading, to: clientSys }
	],
		"RL");
	return (
		<Canvas pixelRatio={window.devicePixelRatio}>

			<ambientLight />
			{/* <pointLight position={[3, 30, 10]} /> */}
			<spotLight position={[10, -30, 10]} color={new Color("#4040ff")} rotation={[0.2, -0.2, 0]} />
			<spotLight position={[-10, -30, 10]} color={new Color("#90ff90")} rotation={[0.2, 0.2, 0]} />
			<Graph graph={graph} />
		</Canvas>
	)
}
