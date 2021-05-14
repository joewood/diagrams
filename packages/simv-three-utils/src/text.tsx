import * as React from "react";
import { forwardRef, useCallback, useMemo } from "react";
import { ExtrudeBufferGeometry, LineCurve3, Mesh, Shape, Vector2, Vector3 } from "three";
import { ExtrudeGeometryOptions } from "three/src/geometries/ExtrudeGeometry";

const stepFunction = (v: number, neg = false) => (neg ? 1 - (v / Math.abs(v) + 1) / 2 : (v / Math.abs(v) + 1) / 2);

const generateTopUV = (
    geometry: ExtrudeBufferGeometry,
    vertices: number[],
    indexA: number,
    indexB: number,
    indexC: number
) => {
    const rear = vertices[indexA * 3 + 2] < 0;
    const a_x = stepFunction(vertices[indexA * 3], rear);
    const a_y = stepFunction(vertices[indexA * 3 + 1], false);
    const b_x = stepFunction(vertices[indexB * 3], rear);
    const b_y = stepFunction(vertices[indexB * 3 + 1], false);
    const c_x = stepFunction(vertices[indexC * 3], rear);
    const c_y = stepFunction(vertices[indexC * 3 + 1], false);
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
    const a_x = ofMax(vertices[indexA * 3], mX);
    const a_y = ofMax(vertices[indexA * 3 + 1], mY);
    const a_z = ofMax(vertices[indexA * 3 + 2], mZ);
    const b_x = ofMax(vertices[indexB * 3], mX);
    const b_y = ofMax(vertices[indexB * 3 + 1], mY);
    const b_z = ofMax(vertices[indexB * 3 + 2], mZ);
    const c_x = ofMax(vertices[indexC * 3], mX);
    const c_y = ofMax(vertices[indexC * 3 + 1], mY);
    const c_z = ofMax(vertices[indexC * 3 + 2], mZ);
    const d_x = ofMax(vertices[indexD * 3], mX);
    const d_y = ofMax(vertices[indexD * 3 + 1], mY);
    const d_z = ofMax(vertices[indexD * 3 + 2], mZ);

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

export interface TextProps {
    width?: number;
    height?: number;
    text: string;
    depth?: number;
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    position: Vector3;
    onClick?: (args: { text: string }) => void;
}

export const Text = forwardRef<Mesh, TextProps>(
    (
        {
            width = 10,
            height = 10,
            text,
            backgroundColor,
            color,
            depth = 0.04,
            position,
            fontSize,
            ...props
        }: TextProps,
        ref
    ) => {
        const adjustedPos = useMemo<Vector3>(() => position.clone().add(new Vector3(0, 0, depth / -2)), [
            position,
            depth,
        ]);

        const shape = useMemo<Shape>(() => {
            const newShape = new Shape();
            newShape.moveTo((width / 2) * -1, (height / 2) * -1);
            newShape.lineTo(width / 2, (height / 2) * -1);
            newShape.lineTo(width / 2, height / 2);
            newShape.lineTo((width / 2) * -1, height / 2);
            newShape.lineTo((width / 2) * -1, (height / 2) * -1);
            return newShape;
        }, [width, height]);

        const extrudeSettings = useMemo<ExtrudeGeometryOptions>(
            () => ({
                steps: 2,
                depth: depth,
                bevelEnabled: true,
                bevelThickness: 0.03 * height,
                bevelSize: 0.03 * height,
                bevelOffset: 0,
                bevelSegments: 5,
                UVGenerator: { generateTopUV, generateSideWallUV },
            }),
            [depth]
        );

        const textCanvas = useMemo(() => {
            const scale = 10;
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) return null;
            // create a larger canvas than the text size to ensure good quality rendered text
            const scaledWidth = width * scale;
            const scaledHeight = height * scale;
            Object.assign(canvas.style, {
                position: "absolute",
                top: `calc(50% - ${scaledHeight / 2}px)`,
            });
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;

            context.scale(scale, scale);
            context.fillStyle = backgroundColor || "grey";
            context.fillRect(0, 0, width, height);
            context.fillStyle = color || "white";
            context.textAlign = "center";
            context.textBaseline = "middle";
            const midX = width / 2;
            const midY = height / 2;
            context.fillText(text, midX, midY);
            return canvas;
        }, [width, height, color, backgroundColor, fontSize, text]);
        const _onClick = useCallback(() => props.onClick?.({ text }), [text, props.onClick]);
        return (
            <mesh ref={ref} onClick={_onClick} position={adjustedPos} {...props}>
                <boxBufferGeometry args={[width, height, depth]} attach="geometry" />
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
