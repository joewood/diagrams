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
    color?: string; // if not specified then a color palette will be used
    /** Name of parent node if hierarchical */
    parent: string | null;
}

export interface PositionedNode extends SimpleNode {
    virtualPos: Point;
    body: Body;
    size: Size;
    // initialPosition?: Point;
    initialSize?: Size;
    parentVirtualPosition: Point;
}

export type ScreenPositionedNode = Omit<PositionedNode, "position"> & {
    screenPosition: Point;
    initialScreenPosition?: Point;
    color:string;
    /** Screen Position that the set of nodes are rendered to */
    parentScreenPosition: Point;
};

export interface SimpleEdge {
    from: string;
    to: string;
    name: string;
    label?: string;
    color?: string;
}

// export interface PositionedEdge extends SimpleEdge {
//     fromNode: PositionedNode;
//     toNode: PositionedNode;
//     name: string;
//     link: Link<SimpleEdge>;
//     color:string;
// }

export type NGraph = Graph<SimpleNode, SimpleEdge>;
export type NGraphLayout = NLayout<NGraph>;

// export type MinMax = [number, number];
export type ScreenRect = { name: string; screenPosition: Point; size: Size };

export interface GraphOptions extends Partial<PhysicsSettings> {
    /** display the length of springs between bodies */
    // debugSpringLengths?: boolean;
    /** display Mass of the node */
    debugMassNode?: boolean;
    defaultWidth?: number;
    defaultHeight?: number;
    textSize?: number;
    nodeMargin?: number;
    titleHeight?: number;
    iterations?: number;
}

export type RequiredGraphOptions = Required<GraphOptions>;

export type ResizeNeededAction = {
    suggestedSize: Size;
};

export const transition = {
    type: "easeInOut",
    duration: 0.4,
};

export const zeroPoint: Point = { x: 0, y: 0 };
