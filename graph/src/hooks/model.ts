import { Body, Layout as NLayout, PhysicsSettings } from "ngraph.forcelayout";
import { Graph, Link } from "ngraph.graph";

export interface Size {
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface SimpleNode {
    /** Must be unique */
    name: string;
    /** hinted start position */
    positionHint?: Point;
    /** non-default size of node */
    size?: Size;
    /** Hierarchical level hint. If no children then level: 1 */
    backgroundColor?: string;
    border?: string;
    shadow?: boolean;
    /** Name of parent node if hierarchical */
    parent: string | null;
    level?: number;
}

export interface PositionedNode extends SimpleNode {
    virtualPos: Point;
    body: Body;
    size: Size;
    // initialPosition?: Point;
    initialSize?: Size;
    parentVirtualPosition: Point;
    expanded?: boolean;
}

export type ScreenPositionedNode = Omit<PositionedNode, "position"> & {
    screenPosition: Point;
    // screenTopLeft: Point;
    initialScreenPosition?: Point;
    /** Screen Position that the set of nodes are rendered to */
    parentScreenPosition: Point;
};

export interface SimpleEdge {
    from: string;
    to: string;
    name: string;
    label?: string;
    color?: string;
    thickness?: number;
    labelColor?: string;
    hierarchical?: boolean;
    score?: number;
}

export interface PositionedEdge extends SimpleEdge {
    fromNode: PositionedNode;
    toNode: PositionedNode;
    name: string;
    link: Link<SimpleEdge>;
}

export type NGraph = Graph<SimpleNode, SimpleEdge>;
export type NGraphLayout = NLayout<NGraph>;

// export type MinMax = [number, number];
export type ScreenRect = { name: string; screenPosition: Point; size: Size };

export interface GraphOptions extends Partial<PhysicsSettings> {
    /** display the length of springs between bodies */
    // debugSpringLengths?: boolean;
    /** display Mass of the node */
    debugMassNode?: boolean;
    defaultSize?: Size;
    textSize?: number;
    nodeMargin?: number;
    titleHeight?: number;
    iterations?: number;
}

export type RequiredGraphOptions = Required<GraphOptions>;

export type ResizeNeededAction = {
    // overlappingX?: boolean;
    // overlappingY?: boolean;
    // shrinkingX?: boolean;
    // shrinkingY?: boolean;
    suggestedSize: Size;
};

export const transition = {
    type: "easeInOut",
    duration: 0.6,
};

export const zeroPoint: Point = { x: 0, y: 0 };
