import React, { useCallback, useState } from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import { Vector3 } from "three"

export function useCameraPan(points: Vector3[]) {
    const { camera } = useThree();
    const [camPos, setCamPos] = useState({ pos: { x: 0, y: 0, z: 4 }, vel: { x: 0, y: 0, z: 0 } })
    const [camLooKAt, setCamLookAt] = useState([0, 0, -1])
    const cb = useCallback(({ clock }: any) => {
        const time = clock.getElapsedTime() / 2
        const index = Math.floor(time) % points.length;
        const next = (index + 1) % points.length;
        const secFraction = time - Math.floor(time);
        setCamPos(pos => ({
            vel: {
                x: ((points[index].x - pos.pos.x) * 0.002 + pos.vel.x) * 0.95,
                y: ((points[index].y - pos.pos.y) * 0.002 + pos.vel.y) * 0.95,
                z: 0//Math.sin(secFraction * 2 * Math.PI) / 500
            },
            pos: {
                x: pos.pos.x + pos.vel.x,
                y: pos.pos.y + pos.vel.y,
                z: pos.pos.z + pos.vel.z
            }
        }));
        setCamLookAt(pos => [(points[next].x - pos[0]) * 0.002 + pos[0], (points[next].y - pos[1]) * 0.002 + pos[1], pos[2]])
    }, [points])
    useFrame(cb);
    camera.position.set(camPos.pos.x, camPos.pos.y, camPos.pos.z)
    camera.lookAt(new Vector3(camPos.pos.x + camPos.vel.x * 3, camPos.pos.y + camPos.vel.y * 3, camLooKAt[2]))
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

export const CameraRig = ({ points }: { points: Vector3[] }) => {
    const pos = useCameraPan(points);
    return <camera attach="camera" position={pos} />
}
