import {Head} from "./Physics/Head.js"
import {Camera} from "./ExportScene.js";
import {UnlitRenderer} from "./ExportRenderer.js";
import {additiveObj, additivePos} from "./ExportRenderer.js";
import {ResizeSystem, UpdateSystem} from './ExportSystems.js'

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

export let Globals = {time: 0, dt: 0, mouseX: 0, mouseY: 0, canvas: canvas}
export let gltfObjects = {};
export let Skills = [];


/* TODO: DO NOT FORGET TO UNCOMMENT LIGHTING IN SHADERS */

await new Head().initObjects(canvas);

const renderer = new UnlitRenderer(gl);


function update(time, dt) {
    for (const gltf of Object.values(gltfObjects))
        gltf.update?.(time, dt);
    gltfObjects.mainChar.scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });
    Globals.time = time;
    Globals.dt = dt;
}

function render() {
    renderer.render(Object.values(gltfObjects).map(elem => elem.scene), gltfObjects.mainChar.properties.camera);

    for (const skill of Skills) {
        if (skill.visible)
            additiveObj(gl, gltfObjects.mainChar.arrowNode, skill.color1, skill.color2, gltfObjects.mainChar.properties.camera);
    }

    if (!gltfObjects.mainChar.finalPos)
        return;
    additivePos(gl, gltfObjects.mainChar.finalPos, [0.0, 0.4, 1.0, 0.6], [0.0, 0.4, 1.0, 0.6], gltfObjects.mainChar.properties.camera);
}

function resize({displaySize: {width, height}}) {
    gltfObjects.mainChar.properties.camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({canvas, resize}).start();
new UpdateSystem({update, render}).start();