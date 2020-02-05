import React, { useCallback, useState, FC } from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import { Vector3 } from "three"

export function useCameraPan(targetPosition: Vector3) {
    const { camera } = useThree();
    const [camPos, setCamPos] = useState({ pos: { x: 0, y: 0, z: 5 }, vel: { x: 0, y: 0, z: 0 } })
    const camLookAtZ = -1;
    const damper = 0.95;
    const spring = 0.004;

    const onFrame = useCallback(() => {
        setCamPos(state => ({
            vel: {
                x: ((targetPosition.x - state.pos.x) * spring + state.vel.x) * damper,
                y: ((targetPosition.y - state.pos.y) * spring + state.vel.y) * damper,
                z: 0//Math.sin(secFraction * 2 * Math.PI) / 500
            },
            pos: {
                x: state.pos.x + state.vel.x,
                y: state.pos.y + state.vel.y,
                z: state.pos.z + state.vel.z
            }
        }));
    }, [targetPosition])
    useFrame(onFrame);
    camera.lookAt(new Vector3(camPos.pos.x + camPos.vel.x * 3, camPos.pos.y + camPos.vel.y * 3, camLookAtZ))
    camera.position.set(camPos.pos.x, camPos.pos.y, camPos.pos.z)
    return [camPos.pos.x, camPos.pos.y, camPos.pos.z];
}

export function useSelectedNode(points: any[]) {
    const [index, setIndex] = useState(0);
    const cb = useCallback(({ clock }: any) => {
        const time = clock.getElapsedTime() / 2
        const index = Math.floor(time) % points.length;
        setIndex(index);
    }, [points])
    useFrame(cb);
    return index;
}

export const CameraRig: FC<{ targetPosition: Vector3 }> = ({ targetPosition }) => {
    const pos = useCameraPan(targetPosition);
    return <camera attach="camera" position={pos} />
}
