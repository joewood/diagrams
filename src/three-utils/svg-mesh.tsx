import React, { FC, useRef, useState, useEffect } from "react";
import { useFrame } from "react-three-fiber";
import { DoubleSide, Color, MeshBasicMaterial, ShapePath, Vector3, BackSide } from "three";
import { SVGLoader, SVGResult, StrokeStyle } from "three/examples/jsm/loaders/SVGLoader";
// import { GridHelper} from "three/examples/jsm/helpers/PositionalAudioHelper"

interface ThisStyle extends StrokeStyle {
    fill: string;
    fillOpacity: number;
    strokeOpacity: number;
    stroke?: string;
}

interface ShapePath2 extends ShapePath {
    userData: {
        style: ThisStyle;
    };
}

interface SvgMeshPathProps {
    path: ShapePath2;
    options: Omit<SvgMeshProps, "url" | "scale" | "position">;
}

const SvgMeshPath: FC<SvgMeshPathProps> = ({
    options: { drawFillShapes, fillShapesWireframe, drawStrokes, strokesWireframe },
    path
}) => {
    const fillMat = useRef<MeshBasicMaterial>();
    const strokeMat = useRef<MeshBasicMaterial>();
    const userData = path.userData;

    return (
        <>
            {drawFillShapes && userData.style.fill !== undefined && userData.style.fill !== "none" && (
                <meshPhongMaterial
                    ref={fillMat}
                    color={new Color().setStyle(userData.style.fill)}
                    opacity={userData.style.fillOpacity}
                    transparent={userData.style.fillOpacity?.toString() === "0"}
                    side={DoubleSide}
                    depthWrite={false}
                    wireframe={fillShapesWireframe}
                />
            )}
            {path.toShapes(false).map((shape, i) => (
                <mesh key={"shape-" + i}>
                    <shapeBufferGeometry attach="geometry" args={[shape]} />
                </mesh>
            ))}
            {drawStrokes && userData.style.stroke !== undefined && userData.style.stroke !== "none" && (
                <meshPhongMaterial
                    ref={strokeMat}
                    color={new Color().setStyle(userData.style.stroke)}
                    opacity={userData.style.strokeOpacity}
                    transparent={userData.style.strokeOpacity < 1}
                    side={DoubleSide}
                    depthWrite={false}
                    wireframe={strokesWireframe}
                />
            )}
            {path.subPaths?.map((subPath, i) => {
                const geometry = SVGLoader.pointsToStroke(subPath?.getPoints(), userData.style, 8, 5);
                return (
                    (geometry && strokeMat.current && (
                        <mesh key={"stroke-" + i} geometry={geometry} material={strokeMat.current} />
                    )) ||
                    null
                );
            })}
        </>
    );
};

interface SvgMeshProps {
    url: string;
    position: Vector3;
    scale: number;
    drawStrokes: boolean;
    strokesWireframe: boolean;
    drawFillShapes: boolean;
    fillShapesWireframe: boolean;
}

const SvgMesh: FC<SvgMeshProps> = ({
    url,
    position,
    scale,
    drawStrokes,
    drawFillShapes,
    fillShapesWireframe,
    strokesWireframe
}) => {
    const [svgData, setSvgData] = useState<SVGResult | null>(null);
    useEffect(() => {
        const loader = new SVGLoader();
        loader.load(url, result => {
            setSvgData(result);
        });
    }, [url, setSvgData]);
    return (
        <group scale={[(1 / 500) * scale, (1 / 500) * scale, 1]} position={position.setX(position.x - 0.5 * scale)}>
            {svgData &&
                svgData.paths.map(
                    path =>
                        path && (
                            <SvgMeshPath
                                path={path as ShapePath2}
                                options={{ drawFillShapes, drawStrokes, strokesWireframe, fillShapesWireframe }}
                            />
                        )
                )}
        </group>
    );
};

SvgMesh.defaultProps = {
    drawFillShapes: true,
    drawStrokes: true,
    fillShapesWireframe: false,
    strokesWireframe: false
};

export { SvgMesh };
