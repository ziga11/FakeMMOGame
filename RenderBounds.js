const vertex = `#version 300 es
layout(location=0) in vec3 aPosition;


uniform mat4 uModelViewProjection;

void main() {
    gl_Position = uModelViewProjection * vec4(aPosition, 1.0);
}`;

const fragment = `#version 300 es

precision mediump float;

out vec4 fragColor;

void main() {
    fragColor = vec4(0, 0, 1, 1);
}`;

export const renderBounds = {
    shaders : {vertex, fragment}
};


const vertexMidPoint = `#version 300 es
layout(location=0) in vec3 aMidpoint;

uniform mat4 uModelViewProjection;

void main() {
    gl_Position = uModelViewProjection * vec4(aMidpoint, 1.0);
}`;

const fragmentMidPoint = `#version 300 es

precision mediump float;

out vec4 fragColor;

void main() {
    fragColor = vec4(0, 1, 0, 1);
}`;

export const shadersMidPoint = {
    shaders : {vertexMidPoint, fragmentMidPoint}
};

/*
import {mat4} from "./External/gl-matrix-module.js";
import {renderBounds} from "./RenderBounds.js";

const program = gl.createProgram();

const vertexShaderSrc = renderBounds.renderBounds.vertex;
const fragmentShaderSrc = renderBounds.renderBounds.fragment;

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSrc);
gl.compileShader(vertexShader);
gl.attachShader(program, vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSrc);
gl.compileShader(fragmentShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
}

if (gltfObjects.mainChar.path !== undefined) {
    gl.useProgram(program);
    const viewMatrix = getGlobalViewMatrix(gltfObjects.mainChar.camera);
    const projectionMatrix = getProjectionMatrix(gltfObjects.mainChar.camera);
    const mvpMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
    const MVPPos = gl.getUniformLocation(program, 'uModelViewProjection');
    gl.uniformMatrix4fv(MVPPos, false, mvpMatrix);

    const buffer = gl.createBuffer();
    const aPositionLoc = 0;
    let lst = [];
    for (const poly of gltfObjects.mainChar.path) {
        if (lst.length !== 0)
            lst.push(...poly.centroid);
        lst.push(...poly.centroid);
    }
    const bufferData = new Float32Array(
        lst
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 3 * 4, 0);
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.LINES, 0, lst.length / 3);
}
*/


/*
    BoundBoxes, using the same program as above

    gl.useProgram(program);
    const viewMatrix = getGlobalViewMatrix(gltfObjects.mainChar.properties.camera);
    const projectionMatrix = getProjectionMatrix(gltfObjects.mainChar.properties.camera);
    const mvpMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
    const MVPPos = gl.getUniformLocation(program, 'uModelViewProjection');
    gl.uniformMatrix4fv(MVPPos, false, mvpMatrix);

    const buffer = gl.createBuffer();
    const aPositionLoc = 0;
    let lst = [];

    for (const value of Object.values(gltfObjects)) {
        const boundBox = value.properties.maxBounds;
        const left = boundBox.x - boundBox.halfWidth;
        const right = boundBox.x + boundBox.halfWidth;
        const bot = boundBox.y - boundBox.halfHeight;
        const top = boundBox.y + boundBox.halfHeight;
        const front = boundBox.z - boundBox.halfDepth;
        const back = boundBox.z + boundBox.halfDepth;
        lst.push(left, bot, front, right, bot, front);
        lst.push(left, top, front, right, top, front);
        lst.push(left, bot, back, right, bot, back);
        lst.push(left, top, back, right, top, back);

        lst.push(left, bot, front, left, top, front);
        lst.push(right, bot, front, right, top, front);
        lst.push(left, bot, back, left, top, back);
        lst.push(right, bot, back, right, top, back);

        lst.push(left, bot, front, left, bot, back);
        lst.push(right, bot, front, right, bot, back);
        lst.push(left, top, front, left, top, back);
        lst.push(right, top, front, right, top, back);
    }
    const bufferData = new Float32Array(lst);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 3 * 4, 0);
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.LINES, 0, lst.length / 3);

*/
