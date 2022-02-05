// import { Graph3, useNgraph3D } from "@diagrams/graph";
// import { Canvas } from "@react-three/fiber";
// import * as React from "react";
// import { useCallback, useEffect, useRef, useState } from "react";
// import { DirectionalLight, DirectionalLightHelper, Mesh, Vector3 } from "three";
// import { edges, nodes } from "./data";
// // import { MeshNode } from "./three-utils/text";
export const x =1;
// interface DemoGraphProps {
    // nodes: GraphNode[];
    // edges: GraphEdge[];
    // pumpProducer: string | null;
    // pumpValue: string[] | null;
    // orbit: boolean;
// }

// export const DemoGraph = ({}: DemoGraphProps) => {
//     // const [pump, setPump] = useState<{ id: string; v: string[] } | null>(null);
//     const [orbit, setOrbit] = useState<boolean>(false);
//     // const pump1 = useCallback(() => setPump({ id: producer1, v: ["1X"] }), [setPump]);
//     // const pump2 = useCallback(() => setPump({ id: producer2, v: ["2X"] }), [setPump]);
//     // const pump3 = useCallback(() => setPump({ id: producer3, v: ["3X"] }), [setPump]);
//     const orbitChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
//         ({ target }) => {
//             console.log("Checked " + target.checked);
//             setOrbit(target.checked);
//         },
//         [setOrbit]
//     );

//     const [selectedNode, setNode] = useState<string | null>(null);
//     const [selectedMesh, setMesh] = useState<Mesh | null>(null);
//     const graph = useNgraph3D(nodes, edges, {});
//     const onSelectNode = useCallback(
//         ({ name, mesh }: { name: string; mesh: Mesh | null }) => {
//             setNode(name);
//             setMesh(mesh);
//         },
//         [setNode, setMesh]
//     );
//     // const graph = useDag(nodes, edges, "RL");
//     // const messages = useMemo(
//     //   () =>
//     //     (pumpValue &&
//     //       pumpProducer &&
//     //       pumpValue.map((v, i) => ({ messageKey: v }))) ||
//     //     [],
//     //   [pumpValue, pumpProducer]
//     // );
//     const light1 = useRef<DirectionalLight>();
//     const light2 = useRef<DirectionalLight>();
//     const light3 = useRef<DirectionalLight>();
//     const light4 = useRef<DirectionalLight>();
//     const lightHelper1 = useRef<DirectionalLightHelper>();
//     const lightHelper2 = useRef<DirectionalLightHelper>();
//     const lightHelper3 = useRef<DirectionalLightHelper>();
//     const lightHelper4 = useRef<DirectionalLightHelper>();

//     useEffect(() => {
//         if (!selectedMesh) {
//             light1.current?.lookAt(new Vector3(0, 0, 0));
//             light2.current?.lookAt(new Vector3(0, 0, 0));
//             light3.current?.lookAt(new Vector3(0, 0, 0));
//             light4.current?.lookAt(new Vector3(0, 0, 0));
//         }
//         if (lightHelper1.current) lightHelper1.current.update();
//         if (lightHelper2.current) lightHelper2.current.update();
//         if (lightHelper3.current) lightHelper3.current.update();
//         if (lightHelper4.current) lightHelper4.current.update();
//         // light1.current?.updateMatrix();
//     }, [selectedMesh, lightHelper1, lightHelper2, lightHelper3, lightHelper4]);
//     const unselect = useCallback((p) => setNode(null), [setNode]);
//     return (
//         <Canvas onClickCapture={unselect}>
//             <ambientLight args={[0x0ffffff, 1.9]} />
//             <>
//                 <spotLight
//                     ref={light1}
//                     {...(selectedMesh && { target: selectedMesh })}
//                     intensity={1}
//                     position={[10, 3, 5]}
//                     args={[0x0ffaaaa, 0.9]}
//                 />
//                 <spotLight
//                     ref={light2}
//                     intensity={1}
//                     {...(selectedMesh && { target: selectedMesh })}
//                     position={[-10, 0, 5]}
//                     args={[0x0aaffaa, 0.9]}
//                 />
//                 <spotLight
//                     ref={light3}
//                     intensity={1}
//                     {...(selectedMesh && { target: selectedMesh })}
//                     position={[-10, 1, -15]}
//                     args={[0x0aaaaff, 0.7]}
//                 />
//                 <spotLight
//                     ref={light4}
//                     {...(selectedMesh && { target: selectedMesh })}
//                     position={[10, 0, -15]}
//                     args={[0x0ffaaff, 0.7]}
//                 />
//             </>
//             {/* {light1.current && <directionalLightHelper ref={lightHelper1} args={[light1.current]} />}
//             {light2.current && <directionalLightHelper ref={lightHelper2} args={[light2.current]} />}
//             {light3.current && <directionalLightHelper ref={lightHelper3} args={[light3.current]} />}
//             {light4.current && <directionalLightHelper ref={lightHelper4} args={[light4.current]} />} */}
//             <Graph3 graph={graph} selectedNode={selectedNode} onSelectNode={onSelectNode} orbit={orbit} />
//         </Canvas>
//     );
// };
