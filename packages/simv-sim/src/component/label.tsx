import React, { memo, RefObject, useMemo, useRef } from "react";
import { Mesh, Vector3 } from "three";
import { Text } from "simv-three-utils";

interface LabelProps {
    /** Name and text to appear on node */
    name: string;
    /** Full width of the node  */
    width: number;
    /** Full depth of the node (usually same as width) */
    depth: number;
    /** Full height of node  */
    height: number;
    position: Vector3;
    onClick: () => void;
    // onSelect: (args: { name: string; mesh: Mesh }) => void;
}

/** The label for a node shown as a 4 sided text element */
export const Label = memo<LabelProps>(({ name, position, width, height, depth, onClick }) => {
    const ref = useRef<Mesh>() as RefObject<Mesh>;
    // const _onSelect = useCallback(
    //     ({ text }: { text: string }) => ref.current && onSelect({ name: text, mesh: ref.current }),
    //     [onSelect, ref]
    // );
    const pos = useMemo(() => position.clone().add(new Vector3(0, height * -0.25 - height * 0.125, 0)), [
        height,
        position,
    ]);
    return (
        <Text
            key={name}
            ref={ref}
            onClick={onClick}
            text={name}
            color={"#202020"}
            width={width}
            height={height * 0.25}
            backgroundColor="#a0a0ff"
            depth={depth}
            position={pos}
        />
    );
});
