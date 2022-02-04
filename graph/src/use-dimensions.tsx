import { Ref, useLayoutEffect, useRef, useState } from "react";
import { Point, Size, zeroPoint } from "./model";

export function useDimensions<T extends HTMLElement = HTMLDivElement>(): [
    Ref<T>,
    {
        position: Point;
        size: Size;
    }
] {
    const [{ position, size }, setDimensions] = useState<{ position: Point; size: Size }>({
        position: zeroPoint,
        size: {
            width: 200,
            height: 200,
        },
    });
    const ref = useRef<T | null>(null);
    useLayoutEffect(() => {
        const size = ref.current?.getBoundingClientRect()?.toJSON() ?? undefined;
        if (size)
            setDimensions({
                position: { x: size.left, y: size.top },
                size: { width: size.width, height: size.height },
            });
    }, []);
    return [ref, { position, size }];
}
