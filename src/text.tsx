import React, { forwardRef, Ref, useCallback, useMemo } from 'react';
import { ReactThreeFiber } from 'react-three-fiber';
import { Mesh } from 'three';

export type MeshProps = ReactThreeFiber.Object3DNode<Mesh, typeof Mesh>;

export interface TextProps {
    width?: number;
    height?: number;
    text: string;
    depth?: number;
    backgroundColor?: string;
    color?: string;
    position: number[];
    onClick: (args: { text: string }) => void;
}


export const Text = forwardRef(({ width, height, text, backgroundColor, color, depth, onClick, ...props }: TextProps, ref: Ref<MeshProps>) => {
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

    // const { viewport } = useThree()
    return (
        <mesh ref={ref} onClick={_onClick} {...props}>
            <boxBufferGeometry args={[_width, _height, depth || 0.06]} attach="geometry" />
            <meshStandardMaterial attachArray="material" color={backgroundColor} />
            <meshStandardMaterial attachArray="material" color={backgroundColor} />
            <meshStandardMaterial attachArray="material" color={backgroundColor} />
            <meshStandardMaterial attachArray="material" color={backgroundColor} />

            <meshStandardMaterial attachArray="material">
                <canvasTexture attach="map" image={textCanvas} />
            </meshStandardMaterial>
            <meshStandardMaterial attachArray="material">
                <canvasTexture attach="map" image={textCanvas} />
            </meshStandardMaterial>
        </mesh>
    )
})

