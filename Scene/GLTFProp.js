import * as Scene from '../ExportScene.js'
import * as Physics from '../ExportPhysics.js'
import * as GLTF from '../ExportModelUtils.js'
import {mat4, quat} from "../External/gl-matrix-module.js";
export class GLTFProp {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.find(node => node.getComponentOfType(Scene.Camera));

        this.TF = this.getTransform({node: this.scene});

        this.calculateBounds();
    }

    addTransform({node, transform, rotation = quat.create(), translation = [0, 0, 0], scale = [1, 1, 1]} = {}) {
        let a = node.getComponentOfType(Physics.Transform);
        if (!a) {
            a = new Physics.Transform();
            node.addComponent(a);
        }
        const tf = transform !== undefined ? transform.matrix : mat4.fromRotationTranslationScale(mat4.create(), rotation, translation, scale);

        a.matrix = mat4.mul(mat4.create(), a.matrix, tf);
    }
    addProperty({node = this.scene, property}) {
        if (property instanceof Physics.Transform)
            this.addTransform({node: node, transform: property});
        else
            node.addComponent(property);
    }
    getTransform({node = this.scene, copy = false}) {
        let tf = node.getComponentOfType(Physics.Transform);
        if (!tf) {
            tf = new Physics.Transform();
            node.addComponent(tf);
        }
        if (!copy)
            return tf;
        else
            return new Physics.Transform({translation: [...tf.translation],
                                                                    scale: [...tf.scale],
                                                                    rotation: [...tf.rotation]})
    }

    calculateBounds() {
        [this.modelNodes, this.bounds] = Scene.getNodes(this.scene);
        this.maxBounds = Scene.getMaxBounds(this.bounds);
    }

    createCameraNode(transform) {
        this.cameraNode = new GLTF.Node();
        this.addTransform({node: this.cameraNode, ...transform});
        this.cameraNode.addChild(this.camera);
        this.scene.removeChild(this.camera);
        this.scene.addChild(this.cameraNode);
    }
}