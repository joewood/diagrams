import React, { FC, useMemo, useState } from 'react';
import { useFrame } from 'react-three-fiber';
import { CatmullRomCurve3 } from "three";


function useRange(n: number) {
    return useMemo(() => {
        const target: number[] = []
        for (let i = 0; i < n; i++) target.push(i);
        return target;
    }, [n]);
}


interface BoxesProps {
    path: CatmullRomCurve3;
    points: number;
}

function useAnimatedPath(points: number, path: CatmullRomCurve3) {
    const [frac, setFrac] = useState(0)
    useFrame(({ clock }) => setFrac(((clock.getElapsedTime() * 100) % 1000) / 1000))
    return useRange(points).map(i => {
        return path.getPointAt(((i / points + frac) * 1000 % 1000) / 1000)
    })
}

export const Boxes: FC<BoxesProps> = ({ path, points }) => {
    return <>
        {useAnimatedPath(points, path).map((pt, i) => {
            return <mesh key={i} position={pt}>
                <sphereGeometry attach="geometry" args={[0.06]} />
                <meshPhongMaterial attach="material" color="#4070f0" />
            </mesh>
        })
        }
    </>
}
