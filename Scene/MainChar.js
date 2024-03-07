import {mat4, quat, vec3} from "../External/gl-matrix-module.js";
import * as Scene from "../ExportScene.js";
import * as HTML from '../ExportHTML.js'
import * as Structure from '../ExportDataStructures.js'
import * as Physics from '../ExportPhysics.js'
import * as Main from '../Main.js'

export class MainChar extends Scene.GLTFObject {
    async init(gltfURL, name, canvas, map) {
        await super.init(gltfURL, name);
        const ownerDoc = canvas.ownerDocument;

        this.leftClickHandler = this.leftClickHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);

        canvas.addEventListener("click", this.leftClickHandler);
        ownerDoc.addEventListener('keydown', this.keydownHandler);

        this.map = map;
        this.canvas = canvas;
        const boundRect = canvas.getBoundingClientRect();

        this.Attr = new Scene.StatAttr({
            Health: 500, MaxHealth: 500,
            Attack: 50, AttackRange: 8, Defense: 10
        });
        this.divObjects = {
            "CharHUD": HTML.CreateImageDiv(canvas, new HTML.ImgObject({
                url: "./Models/HUD/CharHUD.png",
                x: 5, y: 5,
                fixed: true, visible: true
            })),
            "SkillHUD": HTML.CreateImageDiv(canvas, new HTML.ImgObject({
                url: "./Models/HUD/SkillHUD.png",
                centered: true, bot: true,
                visible: true
            })),
            "Health": HTML.CreateImageDiv(canvas, new HTML.ImgObject({
                url: "./Models/HUD/CHealth.png",
                x: 45, y: 20,
                left: true,
                fixed: true, visible: true
            })),
            "RespawnHud": HTML.CreateImageDiv(canvas, new HTML.ImgObject({
                url: "./Models/HUD/RespawnHUD.png",
                centered: true, y: boundRect.height / 2 - 79
            })),
            "RespawnButton": HTML.CreateImageDiv(canvas, new HTML.ImgObject({
                url: "./Models/HUD/RespawnButton.png",
                centered: true, y: boundRect.height / 2 + 50
            }))
        }

        const txt = document.createElement("p");
        txt.style.color = "white";
        txt.style.fontSize = "10px";
        txt.style.marginLeft = "15%";
        txt.style.textAlign = "center";
        txt.style.marginTop = "25px";
        txt.innerText = `${this.Attr.Health}/${this.Attr.MaxHealth}`
        this.divObjects.CharHUD.appendChild(txt);

        this.poly = this.map.ocTreeTerrain.query(new Structure.BoundBox({
                                x: 0, y: 0, z: 0, halfWidth: .5, halfHeight: 2000, halfDepth: .5}), [])[0];
        this.poly.point = this.poly.centroid;
        this.initPoly = Object.assign({}, this.poly);

        this.properties.createCameraNode({translation: [0, 0.7, 0]});

        this.playing = false;
        this.selectedMob = null;
        this.startShoot = false;
        this.shootAction = false;

        this.num = null;

        this.shootInd = 0;
        this.pathInd = 0;


        this.createSkills();
        return this;
    }

    setAttr() {
        this.charRotation = this.scene.children[0].getComponentOfType(Physics.Transform).rotation;
        this.initRotation = quat.clone(this.charRotation);

        const arrNodeInd = 5;
        this.arrowNode = this.properties.modelNodes[arrNodeInd];
        this.localArrPos = this.arrowNode.getComponentOfType(Physics.Transform).translation;
        this.localArrPos[1] = 1.35;
        this.localArrPos[2] = 0.5;
        this.properties.calculateBounds();
        this.arrowMatrix = Scene.getGlobalModelMatrix(this.arrowNode);
    }

    async leftClickHandler(event) {
        this.startShoot = false;
        this.shootAction = false;
        const ray = Physics.calculateRay(event.clientX, event.clientY, this.canvas, this.properties.camera);
        const result = Scene.FindPoly(this.map, ray, this.properties.camera); /* Could be a mob or a Polygon */

        if (!result)
            return;

        if (!(result instanceof Structure.Polygon)) {
            this.selectedMob = result;
            const divHUD = this.selectedMob.divObjects.Hud;
            divHUD.hidden = false;
            const divHealth = this.selectedMob.divObjects.Health;
            divHealth.hidden = false;
            this.selectedMob.showAboveHealth();
            return;
        }

        this.finalPoly = result;

        await this.findPath(this.map, this.poly);
    }

    async findPath() {
        this.path = await this.findPathAsync(this.map, this.poly, this.finalPoly);
        if (this.path.length === 0)
            return;

        this.finalPos = [];

        for (const poly of [this.finalPoly, ...this.finalPoly.neighbors]) {
            for (const pos of poly.positions) {
                this.finalPos.push(...pos);
            }
        }

        this.pathInd = 0;
        this.TPath = [];
        this.PathRot = [];
        this.playing = true;
    }

    async findPathAsync(map, start, end) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const path = Physics.AStar.FindPath(start, end);
                resolve(path);
            }, 0);
        });
    }

    move() {
        if (!this.playing || this.Attr.Health === 0 || this.shootAction)
            return;
        if (this.TPath.length === 0)
            [this.TPath, this.PathRot] = Physics.getT(this.path, 0.01, this.initRotation);
        if (this.pathInd >= this.PathRot.length)
            return;

        const path = this.path;
        const i = this.pathInd;

        const t = Math.min((this.time - this.TPath[i]) / (this.TPath[i + 1] - this.TPath[i]), 1);
        const prevPos = vec3.clone(this.properties.TF.translation);

        quat.slerp(this.charRotation, this.charRotation, this.PathRot[i], t);
        vec3.lerp(this.properties.TF.translation, path[i].point, path[i + 1].point, t);

        [...this.properties.bounds, this.properties.maxBounds].map(bounds => {
            const vecDiff = vec3.sub(vec3.create(), this.properties.TF.translation, prevPos);
            bounds.x += vecDiff[0];
            bounds.y += vecDiff[1];
            bounds.z += vecDiff[2];
        })

        if (t >= 1) {
            this.pathInd++;
            this.poly = path[this.pathInd];
            if (this.pathInd >= this.path.length - 1) {
                this.poly = path[path.length - 1];
                this.playing = false;
                this.finalPos = null;
                if (this.startShoot && this.selectedMob !== null) {
                    this.startShoot = false;
                    this.shootRequirements();
                }
            }
        }
    }

    shoot() {
        if (!this.shootAction || this.arrowT.length === 0 || this.Attr.Health === 0)
            return;
        const i = this.shootInd;

        const t = Math.min((this.time - this.arrowT[i]) / (this.arrowT[i + 1] - this.arrowT[i]), 1);

        const worldPos = vec3.lerp(vec3.create(), this.arrowPath[i], this.arrowPath[i + 1], t);
        const invMatrix = mat4.invert(mat4.create(), Scene.getGlobalModelMatrix(this.arrowNode));

        vec3.transformMat4(this.localArrPos, worldPos, invMatrix);

        const endRotation = Physics.rotate(this.properties.TF.translation, this.mobPos, this.initRotation);
        quat.slerp(this.charRotation, this.charRotation, endRotation, t);

        /* Arrow bounds */
        this.properties.bounds[5].x = worldPos[0];
        this.properties.bounds[5].y = worldPos[1];
        this.properties.bounds[5].z = worldPos[2];

        if (t >= 1) {
            this.shootInd++;
            this.selectedMob.aggro = true;
            this.shootAction = false;

            if (this.shootInd < this.arrowPath.length - 1)
                return;

            this.shootInd = 0;

            vec3.set(this.localArrPos, 0, 1.35, 0.5);

            Main.Skills[this.num - 1].visible = false;

            this.reAssesMob();
        }
    }

    reAssesMob() {
        const EDiv = this.selectedMob.divObjects.Health;
        const healthDiff = (this.Attr.Attack * Main.Skills[this.num - 1].damage - this.selectedMob.Attr.Defense);

        this.selectedMob.Attr.Health = Math.max(this.selectedMob.Attr.Health - healthDiff, 0);
        this.selectedMob.divObjects.Hud.childNodes[1].innerText = `${this.selectedMob.Attr.Health}/${this.selectedMob.Attr.MaxHealth}`;

        const width = this.selectedMob.Attr.Health / this.selectedMob.Attr.MaxHealth;
        HTML.ReCalcImage(EDiv, new HTML.ImgObject({width: width, visible: true}));

        if (width <= 0) {
            for (const div of Object.values(Main.gltfObjects[this.selectedMob.name].divObjects))
                document.body.removeChild(div);

            delete Main.gltfObjects[this.selectedMob.name];
            this.hideEHealth();
        }

        for (const skill of Main.Skills)
            skill.visible = false;
    }

    update(time, dt) {
        this.time = time;
        this.shoot();
        this.move();
        if (this.Attr.Health === 0) {
            this.divObjects.RespawnHud.hidden = false;
            this.divObjects.RespawnButton.hidden = false;

            this.divObjects.RespawnButton.addEventListener("click", () => this.respawn());
            this.canvas.removeEventListener("click", this.leftClickHandler);
        }
    }

    respawn() {
        this.poly = Object.assign({}, this.initPoly);
        vec3.set(this.properties.TF.translation, this.poly.point[0], this.poly.point[1], this.poly.point[2]);
        this.Attr.Health = this.Attr.MaxHealth;

        const CharHUD = this.divObjects.CharHUD;
        CharHUD.childNodes[1].innerText = `${this.Attr.Health}/${this.Attr.MaxHealth}`;

        const Health = this.divObjects.Health;
        const width = this.Attr.Health / this.Attr.MaxHealth;

        HTML.ReCalcImage(Health, new HTML.ImgObject({width: width, visible: true}));

        for (const object of Object.values(Main.gltfObjects)) {
            if (!object.name.includes("mutant"))
                continue;

            object.Attr.Health = object.Attr.MaxHealth;

            const width = object.Attr.Health / object.Attr.MaxHealth;

            HTML.ReCalcImage(object.divObjects.Health, new HTML.ImgObject({width: width, visible: true}));
            HTML.ReCalcImage(object.divObjects.AboveHealth, new HTML.ImgObject({width: width, visible: true}));

            object.divObjects.Hud.hidden = true;
            object.divObjects.Health.hidden = true;

            object.divObjects.AboveHud.hidden = true;
            object.divObjects.AboveHealth.hidden = true;

            object.aggro = false;
        }

        this.divObjects.RespawnHud.hidden = true;
        this.divObjects.RespawnButton.hidden = true;

        this.canvas.addEventListener("click", this.leftClickHandler);
        this.divObjects.RespawnButton.removeEventListener("click", () => this.respawn());
    }

    addComponents(components) {
        super.addComponents(components);
        const maxBounds = this.properties.maxBounds;
        vec3.add(this.properties.TF.translation, this.poly.centroid, [0, Math.abs(maxBounds.y - maxBounds.halfHeight), 0]);
        this.setAttr();
        this.properties.calculateBounds();
    }

    keydownHandler(e) {
        if (e.code === "Escape")
            this.hideEHealth();
        if (!e.code.includes("Digit") || this.shootAction || !this.selectedMob)
            return;

        this.num = parseInt(e.code[e.code.length - 1]);

        if (this.num === 0 || this.num > Main.Skills.length)
            return;
        this.shootRequirements();
    }


    BlinkSkill() {
        const rayCast = Physics.calculateRay(Main.Globals.mouseX, Main.Globals.mouseY, this.canvas, this.properties.camera);
        const distance = vec3.sub(vec3.create(), rayCast, this.properties.TF.translation);
        const dirVec = vec3.normalize(vec3.create(), distance);
        const blinkRange = Math.max(vec3.length(distance), 6);
        const endPos = vec3.scaleAndAdd(vec3.create(), this.properties.TF.translation, dirVec, blinkRange);
        this.finalPoly = this.map.ocTreeTerrain.query(new Structure.BoundBox({
            x: endPos[0], y: endPos[1], z:endPos[2], halfWidth: 0.5, halfHeight: 1000, halfDepth: 0.5
        }));

        this.properties.TF.translation[0] = this.finalPoly.point[0];
        this.properties.TF.translation[0] = this.finalPoly.point[1];
        this.properties.TF.translation[0] = this.finalPoly.point[2];

        /* TODO: Create a blend effect */

        /* You cannot aim outside the map, it won't work, I do not have time to create bounds as OBB, to fix this */
    }

    shootRequirements() {
        if (this.Attr.Health === 0)
            return;
        const mobBounds = this.selectedMob.properties.maxBounds;
        this.mobPos = [mobBounds.x, mobBounds.y + mobBounds.halfHeight / 2, mobBounds.z];

        const distance = vec3.sub(vec3.create(), this.mobPos, this.properties.TF.translation);
        const dirVec = vec3.normalize(vec3.create(), distance);
        const rangeDir = vec3.scale(vec3.create(), dirVec, this.Attr.AttackRange - 0.8);

        if (vec3.length(distance) > this.Attr.AttackRange) {
            const endPos = vec3.add(vec3.create(), this.properties.TF.translation, vec3.sub(vec3.create(), distance, rangeDir));

            const x = endPos[0];
            const y = endPos[1];
            const z = endPos[2];

            this.finalPoly = this.map.ocTreeTerrain.query(new Structure.BoundBox({
                                x: x, y: y, z: z, halfWidth: 0.5, halfHeight: 1000, halfDepth: 0.5}), [])[0];
            this.startShoot = true;
            this.findPath();
            return;
        }

        const arrowPos = vec3.transformMat4(vec3.create(), this.localArrPos, Scene.getGlobalModelMatrix(this.arrowNode));

        this.arrowPath = [arrowPos, this.mobPos];
        this.arrowT = [this.time, this.time + 0.1];

        this.shootInd = 0;

        Main.Skills[this.num - 1].visible = true;
        this.shootAction = true;
    }

    hideEHealth() {
        if (!this.selectedMob)
            return;

        const divHUD = this.selectedMob.divObjects.Hud;
        divHUD.hidden = true;

        const divHealth = this.selectedMob.divObjects.Health;
        divHealth.hidden = true;

        this.selectedMob = null;
    }

    createSkills() {
        Main.Skills.push(new Scene.Skill({color1: [0.8, 0.2, 0.0, 0.8], color2: [1.0, 1.0, 1.0, 0.6], damage: 0.50, dmgOverTime: 0, slow: 0}));
        Main.Skills.push(new Scene.Skill({color1: [0.2, 0.2, 0.2, 0.7], color2: [0.6, 0.4, 0.4, 0.9], damage: 0.50, dmgOverTime: 0, slow: 0}));
        Main.Skills.push(new Scene.Skill({color1: [0.6, 0.8, 1.0, 0.9], color2: [0.8, 0.9, 1.0, 0.8], damage: 0.50, dmgOverTime: 0, slow: 0}));
        Main.Skills.push(new Scene.Skill({color1: [0.4, 0.9, 0.4, 0.6], color2: [1.0, 0.4, 0.4, 0.6], damage: 0.50, dmgOverTime: 0, slow: 0}));
        Main.Skills.push(new Scene.Skill({color1: [0.0, 0.0, 0.0, 1.0], color2: [0.1, 0.1, 0.1, 1.0], damage: 0.50, dmgOverTime: 0, slow: 0}));
        Main.Skills.push(new Scene.Skill({color1: [0.6, 0.8, 0.6, 0.7], color2: [0.2, 0.4, 0.4, 0.8], damage: 0.50, dmgOverTime: 0, slow: 0}));
        Main.Skills.push(new Scene.Skill({color1: [0.2, 0.4, 1.0, 0.9], color2: [0.0, 0.2, 1.0, 0.7], damage: 0.50, dmgOverTime: 0, slow: 0}));
    }
}