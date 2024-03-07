import * as Structure from '../ExportDataStructures.js'
import {vec3} from "../External/gl-matrix-module.js";

export class BoundBox {
    constructor({x, y, z, halfWidth, halfHeight, halfDepth, min, max} = {}) {
        if (min && max) {
            this.halfWidth = (max[0] - min[0]) / 2;
            this.x = min[0] + this.halfWidth;
            this.halfHeight = (max[1] - min[1]) / 2;
            this.y = min[1] + this.halfHeight;
            this.halfDepth = (max[2] - min[2]) / 2;
            this.z = min[2] + this.halfDepth;
            return;
        }
        this.x = x;
        this.y = y;
        this.z = z;
        this.halfWidth = halfWidth;
        this.halfHeight = halfHeight;
        this.halfDepth = halfDepth;
    }

    intersect(object) {
        if ((object.x + object.halfWidth) < (this.x - this.halfWidth) || (object.x - object.halfWidth) > (this.x + this.halfWidth))
            return false;

        if ((object.y + object.halfHeight) < (this.y - this.halfHeight) || (object.y - object.halfHeight) > (this.y + this.halfHeight))
            return false;

        if ((object.z + object.halfDepth) < (this.z - this.halfDepth) || (object.z - object.halfDepth) > (this.z + this.halfDepth))
            return false;

        if (object instanceof Structure.Polygon) {
            const lines = [[object.positions[0], object.positions[1]],
                [object.positions[0], object.positions[2]],
                [object.positions[1], object.positions[2]]];
            // Check each line of the Triangle for the intersection with the box
            for (const [point1, point2] of lines) {
                if ((point2[0] < (this.x - this.halfWidth) && point1[0] < (this.x - this.halfWidth)) ||
                    (point2[0] > (this.x + this.halfWidth) && point1[0] > (this.x + this.halfWidth)) ||
                    (point2[1] < (this.y - this.halfHeight) && point1[1] < (this.y - this.halfHeight)) ||
                    (point2[1] > (this.y + this.halfHeight) && point1[1] > (this.y + this.halfHeight)) ||
                    (point2[2] < (this.z - this.halfDepth) && point1[2] < (this.z - this.halfDepth)) ||
                    (point2[2] > (this.z + this.halfDepth) && point1[2] > (this.z + this.halfDepth)))
                    continue;
                if ((point1[0] > (this.x - this.halfWidth) && point1[0] < (this.x + this.halfWidth)) ||
                    (point1[1] > (this.y - this.halfHeight) && point1[1] < (this.x + this.halfHeight)) ||
                    (point1[2] > (this.z - this.halfDepth) && point1[2] < (this.x + this.halfDepth))) {
                    return true;
                }
            }
            return false;
        }
        return !(((object.x - object.halfWidth) > (this.x + this.halfWidth) &&
                (object.x + object.halfWidth) < (this.x - this.halfWidth)) ||
            ((object.y - object.halfHeight) > (this.y + this.halfHeight) &&
                (object.y + object.halfHeight) < (this.y - this.halfHeight)) ||
            ((object.z - object.halfDepth) > (this.z + this.halfDepth) &&
                (object.z + object.halfDepth) < (this.z - this.halfDepth)))
    }

    position() {
        return vec3.fromValues(this.x, this.y, this.z);
    }

    size() {
        return vec3.fromValues(this.halfWidth, this.halfHeight, this.halfDepth);
    }
}
