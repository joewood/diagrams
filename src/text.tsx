import React, { forwardRef, Ref, useMemo } from 'react';
import { ReactThreeFiber, useThree } from 'react-three-fiber';
import { Mesh } from 'three';

export type MeshProps = ReactThreeFiber.Object3DNode<Mesh, typeof Mesh>;

export interface TextProps {
    width?: number;
    height?: number;
    text?: string;
    depth?: number;
    backgroundColor?: string;
    color?: string;
    position: number[];
}


export const Text = forwardRef(({ width, height, text, backgroundColor, color, depth, ...props }: TextProps, ref: Ref<MeshProps>) => {
    const _width = width || 1
    const _height = height || 0.3
    const _text = text || '<null>'
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
        const fontSize = textureHeight / 1.5;
        context.font = `bold ${fontSize}px Arial, sans-serif`
        context.fillStyle = color || 'white'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        const x = textureWidth / 2
        const y = textureHeight / 2
        context.fillText(_text, x, y)
        return canvas
    }, [width, height, color, backgroundColor, text])

    const { viewport } = useThree()
    return (
        <mesh ref={ref} {...props}>
            <boxBufferGeometry args={[_width, _height, depth || 0.06]} attach="geometry" />
            <meshStandardMaterial attachArray="material" color="grey" />
            <meshStandardMaterial attachArray="material" color="grey" />
            <meshStandardMaterial attachArray="material" color="grey" />
            <meshStandardMaterial attachArray="material" color="grey" />

            <meshStandardMaterial attachArray="material">
                <canvasTexture attach="map" image={textCanvas} />
            </meshStandardMaterial>
            <meshStandardMaterial attachArray="material">
                <canvasTexture attach="map" image={textCanvas} />
            </meshStandardMaterial>
        </mesh>
    )
})

