/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL: string;
  }
}

declare module '*.bmp' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
    const src: string;
    export default src;
}

declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<
    SVGSVGElement
  > & { title?: string }>;

  const src: string;
  export default src;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

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
        wireframe: any;
        wireframeGeometry2: any;
        lineMaterial: any;
    }
}

declare module "ngraph.forcelayout3d" {
    function x(layout: any, settings: any): Layout;
    interface Layout {
        getGraphRect(): { x1: number; x2: number; y1: number; y2: number; z1: number; z2: number };
        getNodePosition(nodeId: string): { x: number; y: number; z: number };
        step();
        setNodePosition(nodeId: string, x: number, y: number, z: number);
    }
    export default x;
}

declare module "threejs-meshline" {}
