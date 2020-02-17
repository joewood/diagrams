import React, { FC, useCallback, useMemo } from 'react'
import { useThree } from 'react-three-fiber'
import { CatmullRomCurve3, Vector3 } from "three"
import { CameraRig } from "./camera-rig"
import { Boxes } from "./message"
import { SpinText } from "./spin-text"

export interface PositionedNode {
	name: string;
	width?: number;
	height?: number;
	x: number;
	y: number;
	z: number;
}

export interface PositionedEdge {
	name?: string;
	messages?: number;
	points: { x: number, y: number, z: number }[]
}

export interface Layout {
	nodes: PositionedNode[];
	edges: PositionedEdge[];
	width: [number, number];
	height: [number, number];
	depth: [number, number]
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
	onSelectNode: (args: { text: string }) => void;
	selectedNode?: string | null;
}

function usePaths(edges: PositionedEdge[], convertGraphX: (x: number) => number, convertGraphY: (y: number) => number, convertGraphZ: (z: number) => number) {
	const paths = useMemo(() => {
		return edges.map(edge => ({ edge, curve: new CatmullRomCurve3(edge.points.map(point => new Vector3(convertGraphX(point.x), convertGraphY(point.y), convertGraphZ(point.z))), false, "catmullrom") }))
	}, [edges, convertGraphX, convertGraphY])
	return paths;
}


export const Graph: FC<GraphProps> = ({ graph, onSelectNode, selectedNode }) => {
	const { viewport } = useThree();
	const viewPortDepth = -5;
	const convertGraphX = useCallback((x: number) => (x - graph.width[0]) * (viewport.width) / (graph.width[1] - graph.width[0]) - viewport.width / 2, [viewport, graph])
	const convertGraphY = useCallback((y: number) => (y - graph.height[0]) * (viewport.height) / (graph.height[1] - graph.height[0]) - viewport.height / 2, [graph, viewport])
	const convertGraphZ = useCallback((z: number) => (z - graph.depth[0]) * (viewPortDepth) / (graph.depth[1] - graph.depth[0]), [graph, viewPortDepth])
	const convertWidth = useCallback((width: number) => width * viewport.width / (graph.width[1] - graph.width[0]), [viewport, graph])
	const convertHeight = useCallback((height: number) => height * viewport.height / (graph.height[1] - graph.height[0]), [viewport, graph])
	const convertDepth = useCallback((depth: number) => depth * viewPortDepth / (graph.depth[1] - graph.depth[0]), [viewport, graph])
	const points = useMemo(() => {
		return graph.nodes.map(n => new Vector3(convertGraphX(n.x), convertGraphY(n.y), convertGraphZ(n.z)))
	}, [graph, convertGraphX, convertGraphY, convertGraphZ])
	const onSelect = useCallback(({ text }: { text: string }) => {
		onSelectNode({ text });
	}, [onSelectNode])
	const selectedNodeIndex = useMemo(() => {
		const index = graph.nodes.findIndex(f => f.name === selectedNode);
		if (index >= 0) return (index);
		return null;
	}, [selectedNode])
	const paths = usePaths(graph.edges, convertGraphX, convertGraphY, convertGraphZ)
	return <>
		<CameraRig targetPosition={selectedNodeIndex === null
			? new Vector3(0, 0, -2)
			: new Vector3(points[selectedNodeIndex].x, points[selectedNodeIndex].y, points[selectedNodeIndex].z)} />
		{
			graph.nodes.map((n, i) => (<SpinText
				key={n.name}
				onClick={onSelect}
				text={n.name}
				color={n.name === selectedNode ? "black" : "white"}
				width={convertWidth(n?.width || 10)}
				height={convertHeight(n?.height || 10)}
				backgroundColor="#4070f0"
				depth={convertWidth((n?.width || 10) / 2)}
				position={[convertGraphX(n.x), convertGraphY(n.y), convertGraphZ(n.z) + convertWidth(n?.width || 10) / 3]} />))
		}
		{
			paths.map((path, i) => {
				return (<mesh key={"mesh" + i}>
					<tubeGeometry
						attach="geometry"
						args={[path.curve, 30, 0.03, 8, false]}
					/>
					<meshPhongMaterial attach="material" color="#333" />
				</mesh>);
			})}
		{paths.map((path, i) => (<Boxes path={path.curve} points={path.edge.messages || 8} />))}
	</>

}


