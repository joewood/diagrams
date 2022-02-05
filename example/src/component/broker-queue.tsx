import * as React from "react";

export const T = 2;
// import { FC } from "react";
// // import { Edges, Label, NodeProps, useCheckMessages, useEdges } from "./node";

// import { SvgMesh } from "@diagrams/svg-mesh";
// import logo from "../kafka.svg";
// import { Vector3 } from "three";

// export const BrokerQueueNode: FC<NodeProps> = ({
//     name,
//     onSelect,
//     width,
//     height,
//     depth,
//     position,
//     messages,
//     edges,
//     onEgress,
// }) => {
//     const elapsed = useCheckMessages(messages);
//     const edgeProps = useEdges(edges, name, messages, elapsed, onEgress);
//     return (
//         <>
//             <SvgMesh
//                 strokesWireframe={false}
//                 fillShapesWireframe={false}
//                 drawFillShapes
//                 drawStrokes
//                 url={logo}
//                 scale={width}
//                 position={
//                     new Vector3(position.x, position.y + height / 3, position.z)
//                 }
//             />
//             <Label
//                 key="label"
//                 name={name}
//                 onSelect={onSelect}
//                 width={width}
//                 height={height}
//                 depth={depth}
//                 position={position}
//             />
//             <Edges edges={edgeProps} />
//         </>
//     );
// };
