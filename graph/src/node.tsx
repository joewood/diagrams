import * as React from "react";
import { FC } from "react";
import { MiniGraphProps } from "./mini-graph";
import { PositionedNode } from "./model";
import { TextBox } from "./svg-react";

export const PaintNode: FC<{
    node: PositionedNode;
    onSelectNode: MiniGraphProps["onSelectNode"];
    options: MiniGraphProps["options"];
}> = ({ node, onSelectNode, options: { textSize } }) => (
    <TextBox
        key={node.name}
        initialPosition={node.initialPosition ?? node.position}
        initialSize={node.initialSize ?? node.size}
        position={node.position}
        size={node.size}
        name={node.name}
        text={node.name}
        fillColor={node.backgroundColor ?? "gray"}
        borderColor={node.border ?? "black"}
        verticalAnchor="start"
        onSelectNode={onSelectNode}
        textSize={textSize}
        textColor="#202020"
        filter={node.shadow ? "url(#shadow)" : undefined}
    />
);
