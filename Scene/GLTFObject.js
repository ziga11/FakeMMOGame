import * as GLTF from "../ExportModelUtils.js";
import * as Structure from '../ExportDataStructures.js'
import * as Scene from '../ExportScene.js'
import * as Main from "../Main.js"

export class GLTFObject {
    async init(url, name, render = true, findBounds = true) {
        const gltfLoader = new GLTF.GLTFLoader();
        await gltfLoader.load(url);
        this.name = name;
        this.scene = gltfLoader.loadScene(gltfLoader.defaultScene);

        if (!this.scene)
            throw new Error("No default charScene");
        this.properties = new Scene.GLTFProp(this.scene);
        this.properties.calculateBounds();

        if (render)
            Main.gltfObjects[name] = this;
        return this;
    }

    addComponents(components) {
        for (const component of components.keys()){
            const [key, val] = [component, components.get(component)];
            this.properties.addProperty({node: key, property: val});
        }
    }
}

export class Map extends GLTFObject {
    async init(url, name) {
        await super.init(url, name);

        this.properties.calculateBounds();

        this.ocTreeTerrain = new Structure.OcTree(this.properties.maxBounds, 100);
        [this.Polygons, this.VertexPolyPair] = Scene.getPolygons(this.properties.modelNodes, this.ocTreeTerrain);
        this.groups = Scene.findNeighbors(this.Polygons, this.VertexPolyPair);

        return this;
    }
}