import React, { useMemo, useRef, forwardRef, FC, Ref, ReactNode, ForwardRefExoticComponent, RefAttributes } from 'react'
import { Canvas, useThree, useFrame, ReactThreeFiber } from 'react-three-fiber'
// import './styles.css'
import { Mesh, Euler } from 'three'

type MeshProps = ReactThreeFiber.Object3DNode<Mesh, typeof Mesh>;

export default function App() {
    return (
        <Canvas pixelRatio={window.devicePixelRatio}>
            <ambientLight />
            <pointLight position={[3, 30, 10]} />
            <SpinText backgroundColor="pink" spinX={4.5} spinY={0.055} text="Lots" color="black" position={[-1.5, -1, 0]} />
            <SpinText backgroundColor="#405060" spinX={4.5} spinY={0.055} text="Of" color="black" position={[-1.5, -1, 2]} />
            <SpinText backgroundColor="#705020" spinX={3.5} spinY={0.065} text="Spinning" color="blue" position={[0, 0, 2]} />
            <Text text="Text" color="white" position={[2.5, 1.52, 1]} />
            <Text text="In" color="white" position={[2.5, 1, 1]} />
            <Text text="Boxes" color="white" position={[2.5, 0.48, 1]} />
            <SpinText backgroundColor="#992343" spinX={5.5} spinY={0.001} text="Here LOng Loing Long" width={400} color="black" position={[1.0, 1, 0]} />
        </Canvas>
    )
}

interface TextProps {
    width?: number;
    height?: number;
    text?: string;
    backgroundColor?: string;
    color?: string;
    position: number[];
}


const Text = forwardRef(({ width, height, text, backgroundColor, color, ...props }: TextProps, ref: Ref<MeshProps>) => {
    const _width = width || 250
    const _height = height || 40
    const _text = text || 'Lorem Ipsum'
    const textCanvas = useMemo(() => {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) return null;
        canvas.style.position = 'absolute'
        canvas.style.top = `calc(50% - ${_height / 2}px)`
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
        canvas.width = _width * 20
        canvas.height = _height * 20
        context.scale(20, 20)
        context.fillStyle = backgroundColor || 'grey'
        context.fillRect(0, 0, _width, _height)
        const fontSize = 32
        context.font = `bold ${fontSize}px Arial, sans-serif`
        context.fillStyle = color || 'white'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        const x = _width / 2
        const y = _height / 2
        context.fillText(_text, x, y)
        return canvas
    }, [width, height, color, backgroundColor, text])

    const { viewport } = useThree()
    //   width = width / viewport.factor
    //   height = height / viewport.factor

    return (
        <mesh ref={ref} {...props}>
            <boxBufferGeometry args={[2.0, 0.5, 0.5]} attach="geometry" />
            <meshStandardMaterial attach="material">
                <canvasTexture attach="map" image={textCanvas} />
            </meshStandardMaterial>
        </mesh>
    )
})


interface SpinProps extends TextProps {
    spinX?: number;
    spinY?: number;
}
const SpinText: FC<SpinProps> = ({ spinX, spinY, ...props }) => {
    const ref: Ref<MeshProps> = useRef<MeshProps>(null)
    useFrame(({ clock }) => {
        const c = ref.current;
        if (!!c) {
            const r = c.rotation as Euler;
             r. set( clock.getElapsedTime() * (spinX || 0.0),clock.getElapsedTime() * (spinY || 0.0),0 ) ;
        }
    })
    return <Text ref={ref} {...props} />
}
