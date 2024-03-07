import * as Import from "../ExportScene.js";
import {mat4, vec4} from "../External/gl-matrix-module.js";

export function calculateRay(mouseX, mouseY, canvas, camera) {
    const x = (2 * mouseX) / canvas.getBoundingClientRect().width - 1;
    const y = 1 - (2 * mouseY) / canvas.getBoundingClientRect().height;

    const clipSpace = [x, y, -1, 1];

    const inverseProjectionMatrix = mat4.invert(mat4.create(), Import.getProjectionMatrix(camera));
    const eyeSpace = vec4.transformMat4(vec4.create(), clipSpace, inverseProjectionMatrix);
    eyeSpace[2] = -1;
    eyeSpace[3] = 0;

    const cameraMatrix = Import.getGlobalModelMatrix(camera);
    const worldSpace = vec4.transformMat4(vec4.create(), eyeSpace, cameraMatrix);
    vec4.normalize(worldSpace, worldSpace);
    return worldSpace.slice(0, 3);
}


export function roundNumber(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}


export function DistanceSquared(vecA, vecB) {
    const dx = vecA[0] - vecB[0];
    const dy = vecA[1] - vecB[1];
    const dz = vecA[2] - vecB[2];

    return dx * dx + dy * dy + dz * dz;
}
