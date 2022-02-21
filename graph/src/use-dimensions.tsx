import { Ref, useLayoutEffect, useRef, useState } from "react";
import { Point, Size, zeroPoint } from "./hooks/model";

export function useDimensions<T extends HTMLElement = HTMLDivElement>(
    trackResize = false
): [
    Ref<T>,
    {
        position: Point;
        size: Size | undefined;
    }
] {
    const [{ position, size }, setDimensions] = useState<{ position: Point; size: Size | undefined }>({
        position: zeroPoint,
        size: undefined,
    });
    const ref = useRef<T | null>(null);
    useLayoutEffect(() => {
        const size = ref.current?.getBoundingClientRect()?.toJSON() ?? undefined;
        if (size)
            setDimensions({
                position: { x: size.left, y: size.top },
                size: { width: size.width, height: size.height },
            });
        if (trackResize) {
            const handler = () =>
                window.requestAnimationFrame(() =>
                    setDimensions((old) => ref.current?.getBoundingClientRect()?.toJSON() ?? old)
                );
            window.addEventListener("resize", handler);
            window.addEventListener("scroll", handler);
            return () => {
                window.removeEventListener("resize", handler);
                window.removeEventListener("scroll", handler);
            };
        }
    }, [trackResize]);
    return [ref, { position, size }];
}
