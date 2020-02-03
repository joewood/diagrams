import React, { FC, Ref, useRef } from 'react'
import { useFrame } from 'react-three-fiber'
import { Euler } from 'three'
import { MeshProps, Text, TextProps } from "./text"

interface SpinProps extends TextProps {
    spinX?: number;
    spinY?: number;
}
export const SpinText: FC<SpinProps> = ({ spinX, spinY, ...props }) => {
    const ref: Ref<MeshProps> = useRef<MeshProps>(null)
    useFrame(({ clock }) => {
        const c = ref.current;
        if (!!c) {
            const r = c.rotation as Euler;
            r.set(clock.getElapsedTime() * (spinX || 0.0), clock.getElapsedTime() * (spinY || 0.0), 0);
        }
    })
    return <Text ref={ref} {...props} />
}
