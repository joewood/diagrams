import React, { forwardRef, useCallback, useMemo } from "react";
import { ExtrudeGeometryOptions } from "three/src/geometries/ExtrudeBufferGeometry";
import { ExtrudeBufferGeometry, LineCurve3, Mesh, Shape, Vector2, Vector3 } from "three";

export interface TextProps {
    width: number;
    height: number;
    text: string;
    depth: number;
    backgroundColor?: string;
    color?: string;
    position: Vector3;
    onClick?: (args: { text: string }) => void;
}

const stepFunction = (v: number, neg = false) => (neg ? 1 - (v / Math.abs(v) + 1) / 2 : (v / Math.abs(v) + 1) / 2);

const generateTopUV = (
    geometry: ExtrudeBufferGeometry,
    vertices: number[],
    indexA: number,
    indexB: number,
    indexC: number
) => {
    const rear = vertices[indexA * 3 + 2] < 0;
    var a_x = stepFunction(vertices[indexA * 3], rear);
    var a_y = stepFunction(vertices[indexA * 3 + 1], false);
    var b_x = stepFunction(vertices[indexB * 3], rear);
    var b_y = stepFunction(vertices[indexB * 3 + 1], false);
    var c_x = stepFunction(vertices[indexC * 3], rear);
    var c_y = stepFunction(vertices[indexC * 3 + 1], false);
    return [new Vector2(a_x, a_y), new Vector2(b_x, b_y), new Vector2(c_x, c_y)];
};

const generateSideWallUV = (
    geometry: ExtrudeBufferGeometry,
    vertices: number[],
    indexA: number,
    indexB: number,
    indexC: number,
    indexD: number
) => {
    const depth = (geometry as any)["parameters"].options.depth;
    const curves = (geometry as any)["parameters"].shapes.curves as LineCurve3[];
    const mX = curves.reduce(
        (p, c) => [Math.min(p[0], c.v1.x, c.v2.x), Math.max(p[1], c.v1.x, c.v2.x)] as [number, number],
        [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER] as [number, number]
    );
    const mY = curves.reduce(
        (p, c) => [Math.min(p[0], c.v1.y, c.v2.y), Math.max(p[1], c.v1.y, c.v2.y)] as [number, number],
        [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER] as [number, number]
    );
    const mZ = [0, depth] as [number, number];
    const ofMax = (v: number, max: [number, number]) => (v - max[0]) / (max[1] - max[0]);
    var a_x = ofMax(vertices[indexA * 3], mX);
    var a_y = ofMax(vertices[indexA * 3 + 1], mY);
    var a_z = ofMax(vertices[indexA * 3 + 2], mZ);
    var b_x = ofMax(vertices[indexB * 3], mX);
    var b_y = ofMax(vertices[indexB * 3 + 1], mY);
    var b_z = ofMax(vertices[indexB * 3 + 2], mZ);
    var c_x = ofMax(vertices[indexC * 3], mX);
    var c_y = ofMax(vertices[indexC * 3 + 1], mY);
    var c_z = ofMax(vertices[indexC * 3 + 2], mZ);
    var d_x = ofMax(vertices[indexD * 3], mX);
    var d_y = ofMax(vertices[indexD * 3 + 1], mY);
    var d_z = ofMax(vertices[indexD * 3 + 2], mZ);

    // if it's left or right side then x will not vary
    if (Math.abs(a_x - b_x) < 0.01) {
        const right = (x: number) => (a_x > 0.5 ? 1 - x : x);
        return [
            new Vector2(right(a_z), a_y),
            new Vector2(right(b_z), b_y),
            new Vector2(right(c_z), c_y),
            new Vector2(right(d_z), d_y),
        ];
    } else {
        return [new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 0)];
    }
};

export const Text = forwardRef<Mesh, TextProps>(
    ({ width, height, text, backgroundColor, color, depth, onClick, position, ...props }: TextProps, ref) => {
        const _width = width;
        const _height = height;
        const _text = text;
        const adjustedPos = useMemo(() => position.clone().add(new Vector3(0, 0, depth / -2)), [position, depth]);

        const shape = useMemo(() => {
            const __shape = new Shape();
            __shape.moveTo((_width / 2) * -1, (_height / 2) * -1);
            __shape.lineTo(_width / 2, (_height / 2) * -1);
            __shape.lineTo(_width / 2, _height / 2);
            __shape.lineTo((_width / 2) * -1, _height / 2);
            __shape.lineTo((_width / 2) * -1, (_height / 2) * -1);
            return __shape;
        }, [_width, _height]);

        const extrudeSettings = useMemo<ExtrudeGeometryOptions>(
            () => ({
                steps: 2,
                depth: depth,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0.0,
                bevelSegments: 5,
                UVGenerator: { generateTopUV, generateSideWallUV },
            }),
            [depth]
        );

        const textCanvas = useMemo(() => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) return null;
            const textureWidth = _width * 20;
            const textureHeight = _height * 20;
            canvas.style.position = "absolute";
            canvas.style.top = `calc(50% - ${textureHeight / 2}px)`;
            canvas.style.width = textureWidth + "px";
            canvas.style.height = textureHeight + "px";
            canvas.width = textureWidth * 20;
            canvas.height = textureHeight * 20;
            context.scale(20, 20);
            context.fillStyle = backgroundColor || "grey";

            context.fillRect(0, 0, textureWidth, textureHeight);
            const fontSize = textureHeight / 1.8;
            context.font = `bold ${fontSize}px Arial, sans-serif`;
            context.fillStyle = color || "white";
            context.textAlign = "center";
            context.textBaseline = "middle";
            const x = textureWidth / 2;
            const y = textureHeight / 2;
            context.fillText(_text, x, y);
            return canvas;
        }, [_width, _height, color, backgroundColor, _text]);
        const _onClick = useCallback(() => onClick?.({ text }), [text, onClick]);
        return (
            <mesh ref={ref} onClick={_onClick} position={adjustedPos} {...props}>
                <boxBufferGeometry args={[_width, _height, depth]} attach="geometry" />
                <extrudeGeometry attach="geometry" args={[shape, extrudeSettings]} />
                <meshStandardMaterial roughness={0.2} metalness={0.6} attachArray="material">
                    <canvasTexture attach="map" image={textCanvas} />
                </meshStandardMaterial>
                <meshStandardMaterial roughness={0.2} metalness={0.6} attachArray="material">
                    <canvasTexture attach="map" image={textCanvas} />
                </meshStandardMaterial>
            </mesh>
        );
    }
);

Text.defaultProps = { depth: 0.04, width: 1, height: 0.3, text: "<null>" };
