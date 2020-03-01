import React, { FC, useCallback, useState, useRef } from "react";
import { useFrame, useThree, extend } from "react-three-fiber";
import { Vector3, PerspectiveCamera } from "three";
import { useVel } from "./use-spring-3d";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

extend({ OrbitControls });

function Controls({ target }: { target?: Vector3 }) {
    const controls = useRef<OrbitControls>();
    const { gl, camera } = useThree();
    useFrame(() => controls && controls.current && controls.current.update());
    return (
        <orbitControls
            ref={controls}
            args={[camera, gl.domElement]}
            enableDamping
            target={target}
            dampingFactor={0.1}
            rotateSpeed={0.5}
        />
    );
}

interface UseCameraRigOptions {
    distance: number;
    rotate?: number;
    orbit?: boolean;
}

export function useCameraPan(targetPosition: Vector3, { distance, rotate, orbit }: UseCameraRigOptions) {
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
    if (!orbit) {
        camera.lookAt(camLookAt);
        camera.position.set(camPos.x, camPos.y, camPos.z);
    } else {
        return camLookAt;
    }
    return camPos;
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

interface CameraRigggProps {
    targetPosition: Vector3;
    distance: number;
    orbit?: boolean;
}

export const CameraRig: FC<CameraRigggProps> = ({ targetPosition, distance, orbit }) => {
    const pos = useCameraPan(targetPosition, { distance, orbit });
    return (
        <>
            {!orbit && <perspectiveCamera attach="camera" {...(!orbit && { position: pos })} args={[45, 2, 1, 100]} />}
            {orbit && <Controls target={pos} />}
        </>
    );
};
