
export interface ff {
    d: number
}
// function useHover(stopPropagation = true) {
//     const [hovered, setHover] = useState(false)
//     const hover = useCallback(e => {
//         if (stopPropagation) e.stopPropagation()
//         setHover(true)
//     }, [])
//     const unhover = useCallback(e => {
//         if (stopPropagation) e.stopPropagation()
//         setHover(false)
//     }, [])
//     const [bind] = useState(() => ({ onPointerOver: hover, onPointerOut: unhover }))
//     return [bind, hovered]
// }


// interface EndPointPRops {
//     position: [number, number, number];
//     onEnd?: any;
//     onDrag?: any;
// }

// interface LinePRops {
//     defaultStart: [number, number, number];
//     defaultEnd: [number, number, number]
// }

// export function Line({ defaultStart, defaultEnd }: LinePRops) {
//     const [start, setStart] = useState(defaultStart)
//     const [end, setEnd] = useState(defaultEnd)
//     const vertices = useMemo(() => [start, end].map(v => new THREE.Vector3(...v)), [start, end])
//     const update = useCallback(self => ((self.verticesNeedUpdate = true), self.computeBoundingSphere()), [])
//     return (
//         <>
//             <line>
//                 <geometry attach="geometry" vertices={vertices} onUpdate={update} />
//                 <lineBasicMaterial attach="material" color="white" />
//             </line>
//             {/* <EndPoint position={start} />
//             <EndPoint position={end} /> */}
//         </>
//     )
// }