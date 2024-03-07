import * as GLTF from "../ExportModelUtils.js";

export class Polygon extends GLTF.Node {
    constructor(positions, E1, E2, midPoint, node, index) {
        super();
        this.E1 = E1;
        this.E2 = E2;
        this.N = midPoint;
        this.positions = positions;
        this.node = node;
        this.neighbors = new Set();
        this.index = index;
    }
}
