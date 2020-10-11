import * as React from "react";
import { FC, memo, useRef } from "react";
import { extend, useFrame, useThree } from "react-three-fiber";
import { Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useVel } from "./use-spring-3d";

extend({ OrbitControls });

const CameraControls: FC<{ target?: Vector3 }> = ({ target }) => {
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
};

interface UseCameraRigOptions {
    /** distance between the camera and the object */
    distance: number;
    /** Slowly orbit around the object */
    orbit?: boolean;

    rotate?: number;
}

/** Return the camera position based on target and time */
function useCameraPosition(targetPosition: Vector3, { distance, rotate, orbit }: UseCameraRigOptions) {
    const { clock, camera } = useThree();
    const t = clock.getElapsedTime() * (((rotate || 360) / 56000) * (2 * Math.PI)) + Math.PI / 2;
    const x = distance * Math.cos(t) + targetPosition.x;
    const z = distance * Math.sin(t) + targetPosition.z;
    const camPosS = new Vector3(x, targetPosition.y, z);
    const camPos = useVel(new Vector3(0, 0, 10), camPosS, { spring: 0.006, damper: 0.9 });
    const camLookAt = useVel(new Vector3(0, 0, 0), targetPosition, {
        spring: 0.01,
        damper: 0.85,
    });
    if (!orbit) {
        camera.lookAt(camLookAt);
        camera.position.set(camPos.x, camPos.y, camPos.z);
    } else {
        return camLookAt;
    }
    return camPos;
}

// export function useSelectedNode(points: any[]) {
//     const [index, setIndex] = useState(0);
//     const cb = useCallback<RenderCallback>(
//         ({ clock }) => {
//             const time = clock.getElapsedTime() / 2;
//             const index = Math.floor(time) % points.length;
//             setIndex(index);
//         },
//         [points]
//     );
//     useFrame(cb);
//     return index;
// }

interface CameraRigProps extends UseCameraRigOptions {
    /** Position for the Camera to target (animating to it) */
    targetPosition: Vector3;
}

/** A Camera Rig object that targets specific objects */
export const CameraRig = memo<CameraRigProps>(({ targetPosition, distance, rotate = 360, orbit = false }) => {
    const pos = useCameraPosition(targetPosition, { distance, rotate, orbit });
    return (
        <>
            <perspectiveCamera attach="camera" {...(!orbit && { position: pos })} args={[45, 2, 1, 100]} />
            {orbit && <CameraControls target={pos} />}
        </>
    );
});
