import React, { useCallback, useState, FC, useEffect } from 'react'
import { useFrame, useThree, stateContext } from 'react-three-fiber'
import { Vector3 } from "three"
import { useVel } from "./use-spring-3d"

export function useCameraPan(targetPosition: Vector3) {
    const { camera } = useThree();
    const camPos = useVel(new Vector3(0, 0, 10), targetPosition, { spring: 0.006, damper: 0.9 });
    const camLookAt = useVel(new Vector3(0, 0, 0), new Vector3(targetPosition.x, targetPosition.y, targetPosition.z - 6), { spring: 0.01, damper: 0.85 })
    camera.lookAt(camLookAt)
    camera.position.set(camPos.x, camPos.y, camPos.z)
    return [camPos.x, camPos.y, camPos.z];
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
    const pos = useCameraPan(new Vector3(targetPosition.x, targetPosition.y, targetPosition.z + 4));
    return <camera attach="camera" position={pos} />
}
