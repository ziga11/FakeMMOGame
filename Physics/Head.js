import {quat} from "../External/gl-matrix-module.js";
import * as Scene from '../ExportScene.js'
import * as Physics from '../ExportPhysics.js'
import * as Structure from '../ExportDataStructures.js'
import * as Main from '../Main.js'
export let boundsMap = new Map();
export let AStar = new Structure.AStar();
export let objectOctree;
export class Head {
    async initObjects(canvas) {
        /* Initialize Map*/
        this.map = await new Scene.Map().init('./Models/map/scene.gltf', "map");
        const bounds = this.map.properties.maxBounds;
        bounds.halfHeight += 2;
        objectOctree = new Structure.OcTree(this.map.properties.maxBounds, 9);
        boundsMap.set(this.map.properties.maxBounds, this.map);

        Main.Globals["map"] = this.map;

        /* Initialize character*/
        this.mainChar = await new Scene.MainChar().init('./Models/char/untitled.gltf', "mainChar", canvas, this.map);



        const components = new Map([
            [this.mainChar.properties.camera, new Scene.TurntableController(this.mainChar, canvas)],
            [this.mainChar.scene.children[0], new Physics.Transform({scale: [100, 100, 100],
                                                rotation: quat.rotateX(quat.create(), quat.create(), -Math.PI / 2)})]]);

        this.mainChar.addComponents(components);

        Main.Globals["camera"] = this.mainChar.properties.camera;

        /* Initialize Mobs */
        for (let i = 0; i < 20; i++) {
            await new Scene.Mob().init('./Models/Mutant/scene.gltf', `mutant${i}`, this.mainChar, this.map);
        }

        console.log(this.mainChar.scene);

        objectOctree.insert(this.map.properties.maxBounds);
    }
}
