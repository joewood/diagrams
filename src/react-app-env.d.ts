/// <reference types="react-scripts" />
// import Graph from "ngraph.graph"

declare module JSX {
    interface IntrinsicElements {
        group: any;
        geometry: any;
        lineBasicMaterial: any;
        mesh: any;
        octahedronGeometry: any;
        meshBasicMaterial: any;
        orbitControls: any; //I added this
        primitive: any; //I added this
        ambientLight: any; //I added this
    }
}

declare module "ngraph.forcelayout3d" {
    function x(layout: any): Layout;
    interface Layout {
        getGraphRect(): { x1: number; x2: number; y1: number; y2: number; z1: number; z2: number };
        getNodePosition(nodeId: string): { x: number; y: number; z: number };
        step();
    }
    export default x;
}
