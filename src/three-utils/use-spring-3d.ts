import { useCallback, useState } from "react";
import { useFrame } from "react-three-fiber";
import { Vector3 } from "three";

interface UseVelConfig {
    damper?: number;
    spring?: number;
}

export function useVel(initial: Vector3, target: Vector3, { damper = 0.72, spring = 0.003 }: UseVelConfig) {
    const [state, set] = useState({ pos: { x: initial.x, y: initial.y, z: initial.z }, vel: { x: 0, y: 0, z: 0 } });
    const onFrame = useCallback(() => {
        set(state => ({
            vel: {
                x: ((target.x - state.pos.x) * spring + state.vel.x) * damper,
                y: ((target.y - state.pos.y) * spring + state.vel.y) * damper,
                z: ((target.z - state.pos.z) * spring + state.vel.z) * damper
            },
            pos: {
                x: state.pos.x + state.vel.x,
                y: state.pos.y + state.vel.y,
                z: state.pos.z + state.vel.z
            }
        }));
    }, [target.x, target.y, target.z, damper, spring]);
    useFrame(onFrame);
    return new Vector3(state.pos.x, state.pos.y, state.pos.z);
}
