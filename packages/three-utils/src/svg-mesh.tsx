import * as React from "react";

import { FC, memo, useEffect, useMemo, useRef, useState } from "react";
import { Color, DoubleSide, MeshBasicMaterial, ShapePath, Vector3 } from "three";
import { StrokeStyle, SVGLoader, SVGResult } from "three/examples/jsm/loaders/SVGLoader";
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
    path,
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
                    transparent={userData.style.fillOpacity < 1}
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
    /** URL or relative path to SVG file */
    url: string;
    /** World coordinates of mesh, centered in the middle */
    position: Vector3;
    /** Defaults to 1 x 1 */
    scale?: number;
    /** Options to draw or wireframe the SVG (default is to draw) */
    drawStrokes?: boolean;
    strokesWireframe?: boolean;
    drawFillShapes?: boolean;
    fillShapesWireframe?: boolean;
}

/** A Mesh Component created from an SVG file loaded at runtime. Renders a flat mesh using individual geometry from paths. */
export const SvgMesh = memo<SvgMeshProps>(
    ({
        url,
        position,
        scale = 1,
        drawStrokes = true,
        drawFillShapes = true,
        fillShapesWireframe = false,
        strokesWireframe = false,
    }) => {
        const [svgData, setSvgData] = useState<SVGResult | null>(null);
        const [viewBox, setViewBox] = useState<number[]>([0, 0, 500, 500]);
        useEffect(() => {
            async function loadSvg() {
                const loader = new SVGLoader();
                const result = await loader.loadAsync(url);
                setSvgData(result);
                const viewbox = (result.xml.ownerDocument?.children[0] as any)?.viewBox?.baseVal;
                if (!!viewbox) setViewBox([viewbox.x, viewbox.y, viewbox.width, viewbox.height]);
                console.log({ viewbox });
            }
            loadSvg();
        }, [url, setSvgData]);
        const pos = useMemo(() => new Vector3(position.x - 0.5 * scale, position.y - 0.5 * scale, position.z), [
            scale,
            position,
        ]);
        return (
            <group
                scale={[(1 / (viewBox[2] - viewBox[0])) * scale, (1 / (viewBox[3] - viewBox[1])) * scale, 1]}
                position={pos}
            >
                {svgData?.paths?.map(
                    (path, i) =>
                        path && (
                            <SvgMeshPath
                                key={`MeshPath-${i}`}
                                path={path as ShapePath2}
                                options={{ drawFillShapes, drawStrokes, strokesWireframe, fillShapesWireframe }}
                            />
                        )
                )}
            </group>
        );
    }
);
