import {vec3, mat4, mat3} from '../External/gl-matrix-module.js';

import * as WebGL from '../ExportModelUtils.js'
import * as Scene from '../ExportScene.js'
import * as Main from '../Main.js'

import { BaseRenderer } from './BaseRenderer.js';

import {
    getLocalModelMatrix,
    getGlobalViewMatrix,
    getGlobalModelMatrix,
    getProjectionMatrix,
    getModels
} from '../Scene/getMatrix.js';

const unlitVertexShader = await fetch(new URL('./Shaders/unlit.vs', import.meta.url))
    .then(response => response.text());

const unlitFragmentShader = await fetch(new URL('./Shaders/unlit.fs', import.meta.url))
    .then(response => response.text());


export class UnlitRenderer extends BaseRenderer {

    constructor(gl) {
        super(gl);

        this.programs = WebGL.buildPrograms(gl, {
            unlit: {
                vertex: unlitVertexShader,
                fragment: unlitFragmentShader,
            },
        });

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
    }

    render(scenes, camera) {
        const gl = this.gl;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.unlit;
        gl.useProgram(program);

        const lightPos = [60, 130, -60];
        const lightColor = [0.1, 0.1, 0.1];

        for (const scene of scenes) {
            const viewMatrix = getGlobalViewMatrix(camera);
            const projectionMatrix = getProjectionMatrix(camera);
            gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
            gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);


            const cameraPos = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(camera));

            gl.uniform3fv(uniforms.uLightPos, lightPos);

            gl.uniform3fv(uniforms.uCameraPos, cameraPos);
            gl.uniform3fv(uniforms.uLightColor, lightColor);
            gl.uniform1f(uniforms.uGloss, .2);
            gl.uniform1f(uniforms.uTime, Main.Globals.time);

            this.renderNode(scene);
        }
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.unlit;

        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);
        gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

        const normalMatrix = mat3.normalFromMat4(mat3.create(), modelMatrix);
        gl.uniformMatrix3fv(uniforms.uNormalMatrix, false, normalMatrix);


        const models = getModels(node);
        for (const model of models) {
            for (const primitive of model.primitives) {
                this.renderPrimitive(primitive);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    renderPrimitive(primitive) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.unlit;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;


        if (material.multipleTextures) {
            gl.uniform1f(uniforms.uSplat, 1.0);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uniforms.splatTexture1, 0);

            const glTexture = this.prepareImage(material.splatTexture1.image);
            const glSampler = this.prepareSampler(material.splatTexture1.sampler);

            gl.bindTexture(gl.TEXTURE_2D, glTexture);
            gl.bindSampler(0, glSampler);


            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i(uniforms.splatTexture1, 1);

            const glTex = this.prepareImage(material.splatTexture2.image);
            const glSam = this.prepareSampler(material.splatTexture2.sampler);

            gl.bindTexture(gl.TEXTURE_2D, glTex);
            gl.bindSampler(1, glSam);

            for (let i = 0; i < material.multipleTextures.length; i++) {
                const index = i + 2;
                gl.activeTexture(gl.TEXTURE0 + index);
                gl.uniform1i(uniforms[`uTex${i}`], index);

                const glTexture = this.prepareImage(material.multipleTextures[i].image);
                const glSampler = this.prepareSampler(material.multipleTextures[i].sampler);

                gl.bindTexture(gl.TEXTURE_2D, glTexture);
                gl.bindSampler(index, glSampler);
            }
        }
        else {
            gl.uniform1f(uniforms.uSplat, 0.0);
            gl.uniform4fv(uniforms.uBaseFactor, material.baseFactor);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uniforms.uBaseTexture, 0);

            const glTexture = this.prepareImage(material.baseTexture.image);
            const glSampler = this.prepareSampler(material.baseTexture.sampler);

            gl.bindTexture(gl.TEXTURE_2D, glTexture);
            gl.bindSampler(0, glSampler);
        }

        gl.activeTexture(gl.TEXTURE8);
        gl.uniform1i(uniforms.uNormalTexture, 8);

        const NormalTexture = this.prepareImage(material.normalTexture.image);
        const NormalSampler = this.prepareSampler(material.normalTexture.sampler);

        gl.bindTexture(gl.TEXTURE_2D, NormalTexture);
        gl.bindSampler(8, NormalSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }
}
