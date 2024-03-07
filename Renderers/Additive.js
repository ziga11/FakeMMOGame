import { mat4 } from "../External/gl-matrix-module.js";
import * as Scene from '../ExportScene.js'
import * as Physics from '../ExportPhysics.js'
import * as Main from "../Main.js";
import * as WebGL from '../ExportModelUtils.js'

const ArrowVertex = await fetch(new URL('./Shaders/Arrow.vs', import.meta.url))
    .then(response => response.text());

const ArrowFragment = await fetch(new URL('./Shaders/Arrow.fs', import.meta.url))
    .then(response => response.text());

const BlinkVertex = await fetch(new URL('./Shaders/Blink.vs', import.meta.url))
    .then(response => response.text());

const BlinkFragment = await fetch(new URL('./Shaders/Blink.fs', import.meta.url))
    .then(response => response.text());

export function additivePos(gl, positions, color1, color2, camera) {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.enable(gl.CULL_FACE);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const a = WebGL.buildPrograms(gl, {
        arg: {
            vertex: ArrowVertex,
            fragment: ArrowFragment
        }
    });
    const {attributes, program, uniforms} = a.arg;

    gl.useProgram(program);

    const viewMatrix = Scene.getGlobalViewMatrix(camera);
    const projectionMatrix = Scene.getProjectionMatrix(camera);
    const vp = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
    gl.uniformMatrix4fv(uniforms.uModelViewProjection, false, vp);

    gl.uniform4fv(uniforms.uStartColor, color1);
    gl.uniform4fv(uniforms.uEndColor, color2);
    gl.uniform1f(uniforms.uTime, Main.Globals.time);

    const buf = new Float32Array(positions);
    WebGL.createBuffer(gl, {data: buf});
    WebGL.configureAttribute(gl, {
        location: attributes.aPosition,
        count: 3,
        type: gl.FLOAT,
        stride: 3 * 4,
        offset: 0
    });

    gl.drawArrays(gl.TRIANGLES, 0, positions.length);
    gl.disable(gl.BLEND);
}


export function additiveObj(gl, modelNode, color1, color2, camera) {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.enable(gl.CULL_FACE);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const a = WebGL.buildPrograms(gl, {
        arg: {
            vertex: ArrowVertex,
            fragment: ArrowFragment
        }
    })
    const {attributes, program, uniforms} = a.arg;

    gl.useProgram(program);

    modelNode.getComponentOfType(Physics.Transform).scale = [10, 10, 2];

    const viewMatrix = Scene.getGlobalViewMatrix(camera);
    const projectionMatrix = Scene.getProjectionMatrix(camera);
    const modelMatrix = Scene.getGlobalModelMatrix(modelNode);
    const mv = mat4.multiply(mat4.create(), viewMatrix, modelMatrix);
    const mvp = mat4.multiply(mat4.create(), projectionMatrix, mv);
    gl.uniformMatrix4fv(uniforms.uModelViewProjection, false, mvp);

    gl.uniform4fv(uniforms.uStartColor, color1);
    gl.uniform4fv(uniforms.uEndColor, color2);
    gl.uniform1f(uniforms.uTime, Main.Globals.time);

    const models = Scene.getModels(modelNode);
    let vertices = [];

    for (const vertex of models[0].primitives[0].mesh.vertices)
        vertices.push(...vertex.position);

    const indices = models[0].primitives[0].mesh.indices;

    WebGL.createBuffer(gl, {
        data: new Float32Array(vertices)
    })
    WebGL.configureAttribute(gl, {
        location: attributes.aPosition,
        count: 3,
        type: gl.FLOAT,
        stride: 3 * 4,
        offset: 0
    });

    WebGL.createBuffer(gl, {
        data: new Uint32Array(indices),
        target: gl.ELEMENT_ARRAY_BUFFER
    })


    modelNode.getComponentOfType(Physics.Transform).scale = [1, 1, 1];

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);

    gl.disable(gl.BLEND);
}