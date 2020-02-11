import React, { forwardRef, Ref, useCallback, useMemo } from 'react';
import { ReactThreeFiber } from 'react-three-fiber';
import { ExtrudeBufferGeometry, ExtrudeGeometryOptions, Mesh, Shape, UVGenerator, Vector2 } from 'three';

export type MeshProps = ReactThreeFiber.Object3DNode<Mesh, typeof Mesh>;

export interface TextProps {
    width: number;
    height: number;
    text: string;
    depth: number;
    backgroundColor?: string;
    color?: string;
    position: number[];
    onClick: (args: { text: string }) => void;
}


const generateTopUV = (geometry: ExtrudeBufferGeometry, vertices: number[], indexA: number, indexB: number, indexC: number) => {
    const cure = (j: number) => (j / Math.abs(j) + 1) / 2
    var a_x = cure(vertices[indexA * 3]);
    var a_y = cure(vertices[indexA * 3 + 1]);
    var b_x = cure(vertices[indexB * 3]);
    var b_y = cure(vertices[indexB * 3 + 1]);
    var c_x = cure(vertices[indexC * 3]);
    var c_y = cure(vertices[indexC * 3 + 1]);
    return [
        new Vector2(a_x, a_y),
        new Vector2(b_x, b_y),
        new Vector2(c_x, c_y)
    ];

}

const generateSideWallUV = (geometry: ExtrudeBufferGeometry, vertices: number[], indexA: number, indexB: number, indexC: number, indexD: number) => {
    var a_x = vertices[indexA * 3];
    var a_y = vertices[indexA * 3 + 1];
    var a_z = vertices[indexA * 3 + 2];
    var b_x = vertices[indexB * 3];
    var b_y = vertices[indexB * 3 + 1];
    var b_z = vertices[indexB * 3 + 2];
    var c_x = vertices[indexC * 3];
    var c_y = vertices[indexC * 3 + 1];
    var c_z = vertices[indexC * 3 + 2];
    var d_x = vertices[indexD * 3];
    var d_y = vertices[indexD * 3 + 1];
    var d_z = vertices[indexD * 3 + 2];
    if (Math.abs(a_y - b_y) < 0.01) {
        return [
            new Vector2(a_x, 1 - a_z),
            new Vector2(b_x, 1 - b_z),
            new Vector2(c_x, 1 - c_z),
            new Vector2(d_x, 1 - d_z)
        ];
    } else {
        return [
            new Vector2(a_y, 1 - a_z),
            new Vector2(b_y, 1 - b_z),
            new Vector2(c_y, 1 - c_z),
            new Vector2(d_y, 1 - d_z)
        ];
    }
}


export const Text = forwardRef(({ width, height, text, backgroundColor, color, depth, onClick, position, ...props }: TextProps, ref: Ref<MeshProps>) => {
    const _width = width
    const _height = height
    const _text = text

    const shape = useMemo(() => {
        const __shape = new Shape();
        __shape.moveTo(_width / 2 * -1, _height / 2 * -1);
        __shape.lineTo(_width / 2, _height / 2 * -1);
        __shape.lineTo(_width / 2, _height / 2);
        __shape.lineTo(_width / 2 * -1, _height / 2);
        __shape.lineTo(_width / 2 * -1, _height / 2 * -1);
        return __shape;
    }, [_width, _height])

    const extrudeSettings = useMemo<ExtrudeGeometryOptions>(() => ({
        steps: 2,
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0.0,
        bevelSegments: 5,
        UVGenerator: { generateTopUV, generateSideWallUV }
    }), [depth]);

    const textCanvas = useMemo(() => {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) return null;
        const textureWidth = _width * 20;
        const textureHeight = _height * 20;
        canvas.style.position = 'absolute'
        canvas.style.top = `calc(50% - ${textureHeight / 2}px)`
        canvas.style.width = textureWidth + 'px'
        canvas.style.height = textureHeight + 'px'
        canvas.width = textureWidth * 20
        canvas.height = textureHeight * 20
        context.scale(20, 20)
        context.fillStyle = backgroundColor || 'grey'

        context.fillRect(0, 0, textureWidth, textureHeight)
        const fontSize = textureHeight / 1.8;
        context.font = `bold ${fontSize}px Arial, sans-serif`
        context.fillStyle = color || 'white'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        const x = textureWidth / 2
        const y = textureHeight / 2
        context.fillText(_text, x, y)
        return canvas
    }, [_width, _height, color, backgroundColor, _text])
    const _onClick = useCallback((e: any) => {
        onClick({ text })
    }, [text, onClick])
    return (
        <mesh ref={ref} onClick={_onClick} position={[position[0], position[1], position[2] - depth / 2]}  {...props}>
            <boxBufferGeometry args={[_width, _height, depth || 0.06]} attach="geometry" />
            <extrudeGeometry attach="geometry" args={[shape, extrudeSettings]} />
            <meshStandardMaterial roughness={0.2} metalness={0.6} attachArray="material" >
                <canvasTexture attach="map" image={textCanvas} />
            </meshStandardMaterial>
            <meshStandardMaterial roughness={0.2} metalness={0.8} attachArray="material" color={backgroundColor} />
        </mesh>
    )
})

Text.defaultProps = { depth: 0.04, width: 1, height: 0.3, text: "<null>" }
