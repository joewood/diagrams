import { mix } from "chroma-js";
import { motion } from "framer-motion";
import * as React from "react";
import { FC, MouseEventHandler, useCallback } from "react";
import { MiniGraphProps } from "./mini-graph";
import { ScreenPositionedNode } from "./model";
import { TextBox } from "./svg-react";

type ReuseMiniGraphProps = "onSelectNode" | "selectedNode" | "onExpandToggleNode" | "options";

interface Props extends Pick<MiniGraphProps, ReuseMiniGraphProps> {
    node: ScreenPositionedNode;
    showExpandButton?: boolean;
    expanded?: boolean;
}

export const Node: FC<Props> = ({
    node,
    onSelectNode,
    selectedNode,
    showExpandButton,
    onExpandToggleNode,
    expanded,
    options: { textSize },
}) => {
    const onClick = useCallback<MouseEventHandler<SVGTextElement>>(
        () => onExpandToggleNode?.({ name: node.name, expand: !expanded }),
        [expanded, node.name, onExpandToggleNode]
    );
    return (
        <TextBox
            key={node.name}
            initialPosition={node.initialScreenPosition ?? node.screenPosition}
            initialSize={node.initialSize ?? node.size}
            position={node.screenPosition}
            size={node.size}
            name={node.name}
            text={node.name}
            fillColor={node.backgroundColor ?? "gray"}
            borderColor={node.border ?? mix(node.backgroundColor ?? "gray", "black", 0.3).css()}
            borderThickness={selectedNode === node.name ? 2 : 1}
            verticalAnchor="start"
            onSelectNode={onSelectNode}
            textSize={textSize}
            textColor="#202020"
            filter={node.shadow ? "url(#shadow)" : undefined}
        >
            {showExpandButton && (
                <motion.text
                    fontSize={textSize * 2}
                    initial={{
                        x: (node.initialSize ?? node.size).width - textSize * 2,
                        y: textSize * 2,
                    }}
                    style={{ userSelect: "none" }}
                    cursor="pointer"
                    onClick={onClick}
                    animate={{
                        x: node.size.width - textSize * 2,
                        y: textSize * 2,
                    }}
                >
                    {expanded ? "-" : "+"}
                </motion.text>
            )}
        </TextBox>
    );
};
