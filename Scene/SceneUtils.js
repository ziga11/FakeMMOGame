import * as Structure from '../ExportDataStructures.js'
import * as Scene from '../ExportScene.js'
import * as GLTF from '../ExportModelUtils.js'
import {vec3} from "../External/gl-matrix-module.js";

export function getNodes(node, boundBoxes = [], modelNodes = []) {
    for (const child of node.children)
        getNodes(child, boundBoxes, modelNodes);
    const model = node.getComponentOfType(GLTF.Model);
    if (!model)
        return [modelNodes, boundBoxes];
    const matrix = Scene.getGlobalModelMatrix(node);
    const max = [-Infinity, -Infinity, -Infinity];
    const min = [+Infinity, +Infinity, +Infinity];
    for (const primitive of model.primitives) {
        const primMin = vec3.clone(primitive.mesh.accessors.POSITION.min);
        const primMax = vec3.clone(primitive.mesh.accessors.POSITION.max);
        vec3.transformMat4(primMin, primMin, matrix);
        vec3.transformMat4(primMax, primMax, matrix);
        for (let i = 0; i < 3; i++) {
            if (primMin[i] > primMax[i])
                [primMin[i], primMax[i]] = [primMax[i], primMin[i]];
            if (primMax[i] > max[i])
                max[i] = primMax[i];
            if (primMin[i] < min[i])
                min[i] = primMin[i];
        }
    }
    boundBoxes.push(new Structure.BoundBox({min: min, max: max}));
    modelNodes.push(node);
    return [modelNodes, boundBoxes];
}

export function getMaxBounds(boundBoxes) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const boundBox of boundBoxes) {
        if (boundBox.x - boundBox.halfWidth < min[0])
            min[0] = boundBox.x - boundBox.halfWidth;
        if (boundBox.x + boundBox.halfWidth > max[0])
            max[0] = boundBox.x + boundBox.halfWidth;
        if (boundBox.y - boundBox.halfHeight < min[1])
            min[1] = boundBox.y - boundBox.halfHeight;
        if (boundBox.y + boundBox.halfHeight > max[1])
            max[1] = boundBox.y + boundBox.halfHeight;
        if (boundBox.z - boundBox.halfDepth < min[2])
            min[2] = boundBox.z - boundBox.halfDepth;
        if (boundBox.z + boundBox.halfDepth > max[2])
            max[2] = boundBox.z + boundBox.halfDepth;
    }
    return new Structure.BoundBox({min: min, max: max});
}

export function getPolygons(modelNodes, ocTree = null) {
    let Polygons = [];
    let VertexPolyPair = {};
    for (const node of modelNodes) {
        const matrix = Scene.getGlobalModelMatrix(node);
        const model = node.getComponentOfType(GLTF.Model);
        for (const primitive of model.primitives) {
            const vertices = primitive.mesh.vertices;
            const indices = primitive.mesh.indices;
            for (let i = 0; i < indices.length; i += 3) {
                const vertex1 = vec3.transformMat4(vec3.create(), vertices[indices[i]].position, matrix);
                const vertex2 = vec3.transformMat4(vec3.create(), vertices[indices[i + 1]].position, matrix);
                const vertex3 = vec3.transformMat4(vec3.create(), vertices[indices[i + 2]].position, matrix);
                const E1 = vec3.sub(vec3.create(), vertex2, vertex1);
                const E2 = vec3.sub(vec3.create(), vertex3, vertex1);
                const N = vec3.cross(vec3.create(), E1, E2);

                const polygon = new Structure.Polygon([vertex1, vertex2, vertex3], E1, E2, N, node, i / 3);

                VertexPolyPair[Scene.toString(vertex1)] = (VertexPolyPair[Scene.toString(vertex1)] ?? []).concat(polygon);
                VertexPolyPair[Scene.toString(vertex2)] = (VertexPolyPair[Scene.toString(vertex2)] ?? []).concat(polygon);
                VertexPolyPair[Scene.toString(vertex3)] = (VertexPolyPair[Scene.toString(vertex3)] ?? []).concat(polygon);
                if (ocTree)
                    ocTree.insert(polygon);
                Polygons.push(polygon);
            }
        }
    }
    return [Polygons, VertexPolyPair];
}
