import { quat, vec3 } from '../External/gl-matrix-module.js';
import * as Physics from '../ExportPhysics.js'
import * as Main from '../Main.js'
import {Globals} from "../Main.js";

export class TurntableController {

    constructor(mainChar, domElement, {
        pitch = -0.5,
        yaw = Math.PI,
        distance = 30,
        moveSensitivity = 0.004,
        zoomSensitivity = 0.002,
    } = {}) {
        this.mainChar = mainChar;
        this.domElement = domElement;
        this.pitch = pitch;
        this.yaw = yaw;
        this.distance = distance;

        this.moveSensitivity = moveSensitivity;
        this.zoomSensitivity = zoomSensitivity;

        this.initHandlers();
    }

    initHandlers() {
        this.moveCameraHandler = this.moveCameraHandler.bind(this);
        this.pointerupHandler = this.pointerupHandler.bind(this);
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.wheelHandler = this.wheelHandler.bind(this);
        this.domElement.addEventListener('pointerdown', e => {
            if (e.button === 2)
                this.moveCameraHandler(e)
        });
        this.domElement.addEventListener('wheel', this.wheelHandler);
    }

    moveCameraHandler(e) {
        this.domElement.requestPointerLock();
        this.domElement.addEventListener('pointerup', this.pointerupHandler);
        this.domElement.addEventListener('pointermove', this.pointermoveHandler);
        this.domElement.removeEventListener('pointerdown', this.moveCameraHandler);
    }

    pointerupHandler(e) {
        this.domElement.ownerDocument.exitPointerLock();
        this.domElement.addEventListener('pointerdown', e => {
            if (e.button === 2)
                this.moveCameraHandler(e)
        })
        this.domElement.removeEventListener('pointerup', this.pointerupHandler);
        this.domElement.removeEventListener('pointermove', this.pointermoveHandler);
    }
    pointermoveHandler(e) {
        Globals.mouseX = e.clientX;
        Globals.mouseY = e.clientY;

        const dx = e.movementX;
        const dy = e.movementY;

        this.pitch -= dy * this.moveSensitivity;
        this.yaw   -= dx * this.moveSensitivity;

        const twopi = Math.PI * 2;
        const halfpi = Math.PI / 2;

        this.pitch = Math.min(Math.max(this.pitch, -halfpi), halfpi);
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

    wheelHandler(e) {
        this.distance *= Math.exp(this.zoomSensitivity * e.deltaY);
        this.distance = Math.min(Math.max(this.distance, 7), 150);
    }


    update() {
        const transform = this.mainChar.properties.camera.getComponentOfType(Physics.Transform);
        if (!transform)
            return;

        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        transform.rotation = rotation;

        const translation = [0, 0, this.distance];
        vec3.rotateX(translation, translation, [0, 0, 0], this.pitch);
        vec3.rotateY(translation, translation, [0, 0, 0], this.yaw);
        transform.translation = translation;
    }
}
