import React, { FC, useCallback, useState } from "react";
import { useFrame, useThree } from "react-three-fiber";
import { Vector3 } from "three";
import { useVel } from "./use-spring-3d";

export function useCameraPan(targetPosition: Vector3, { distance, rotate }: { distance: number; rotate?: number }) {
    const { clock, camera } = useThree();
    const t = clock.getElapsedTime() * (((rotate || 360) / 56000) * (2 * Math.PI)) + Math.PI / 2;
    const x = distance * Math.cos(t) + targetPosition.x;
    const z = distance * Math.sin(t) + targetPosition.z;
    const camPosS = new Vector3(x, targetPosition.y, z);
    const camPos = useVel(new Vector3(0, 0, 10), camPosS, { spring: 0.006, damper: 0.9 });
    const camLookAt = useVel(new Vector3(0, 0, 0), targetPosition, {
        spring: 0.01,
        damper: 0.85
    });
    // camera.lookAt(new Vector3(0, 0, 0));
    camera.lookAt(camLookAt);
    camera.position.set(camPos.x, camPos.y, camPos.z);
    // camera.position.set(0, 0, 10);
    // return [0, 0, 10];
    return [camPos.x, camPos.y, camPos.z];
}

export function useSelectedNode(points: any[]) {
    const [index, setIndex] = useState(0);
    const cb = useCallback(
        ({ clock }: any) => {
            const time = clock.getElapsedTime() / 2;
            const index = Math.floor(time) % points.length;
            setIndex(index);
        },
        [points]
    );
    useFrame(cb);
    return index;
}

export const CameraRig: FC<{ targetPosition: Vector3; distance: number }> = ({ targetPosition, distance }) => {
    const pos = useCameraPan(new Vector3(targetPosition.x, targetPosition.y, targetPosition.z), { distance });
    return <perspectiveCamera attach="camera" position={pos} args={[45, 2, 1, 100]} />;
};
