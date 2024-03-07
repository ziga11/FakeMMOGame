import {quat, vec3} from "../External/gl-matrix-module.js";
import * as Structure from '../ExportDataStructures.js'
import * as Physics from '../ExportPhysics.js'
import * as Scene from "../ExportScene.js";
import * as HTML from '../ExportHTML.js'

export class Mob extends Scene.GLTFObject {
    async init(url, name, mainChar, map, render = true) {
        await super.init(url, name, render);
        this.map = map;
        this.mainChar = mainChar;

        const mapBounds = this.map.properties.maxBounds;

        this.rotation = this.scene.children[0].getComponentOfType(Physics.Transform).rotation;
        this.initRot = quat.clone(this.rotation);

        this.aggro = false;
        this.aggroRng = 6;
        this.time = 0;
        this.atk = false;
        this.moving = false;
        this.Attr = new Scene.StatAttr({
            MaxHealth: 500, Health: 500,
            Attack: 35, AttackRange: 1, Defense: 2
        });
        this.damage = 40;
        const canvas = this.mainChar.canvas;

        this.divObjects = {
            "Hud": HTML.CreateImageDiv(canvas, new HTML.ImgObject({
                url: "./Models/Hud/EHUD.png",
                centered: true, y: 5
            })),
            "Health": HTML.CreateImageDiv(canvas, new HTML.ImgObject({
                url: "./Models/Hud/EHealth.png",
                centered: true, y: 5
            })),
            "AboveHud": HTML.CreateImageDiv(canvas, new HTML.ImgObject({
                url: "./Models/Hud/AboveHud.png",
                x: 0, y: 0
            })),
            "AboveHealth": HTML.CreateImageDiv(canvas, new HTML.ImgObject({
                url: "./Models/Hud/AboveHealth.png",
                x: 0, y: 0
            }))
        }
        const txt = document.createElement("p");
        txt.style.color = "white";
        txt.style.fontSize = "15px";
        txt.style.textAlign = "center"
        txt.style.marginTop = "0px";
        txt.style.zIndex = "10";
        txt.innerText = `${this.Attr.Health}/${this.Attr.MaxHealth}`
        this.divObjects.Hud.appendChild(txt);

        const ranX = Math.random() * ((mapBounds.x + mapBounds.halfWidth) - (mapBounds.x - mapBounds.halfWidth + 10) + 1) + (mapBounds.x - mapBounds.halfWidth + 10);
        const ranZ = Math.random() * ((mapBounds.z + mapBounds.halfDepth) - (mapBounds.z - mapBounds.halfDepth + 10) + 1) + (mapBounds.z - mapBounds.halfDepth + 10);


        this.path = [];
        this.TArr = [];
        this.TRotArr = [];
        this.LastPathTime = 0;
        this.LastAtkTime = 0;


        this.poly = this.map.ocTreeTerrain.query(new Structure.BoundBox({x: ranX, y: 20, z: ranZ, halfWidth: 1, halfHeight: 1000, halfDepth: 1}), [])[0];
        this.poly.point = this.poly.centroid;
        this.properties.TF.translation = this.poly.positions[0];
        this.prevMainPoly = null


        this.properties.calculateBounds();

        Physics.objectOctree.insert(this.properties.maxBounds);
        Physics.boundsMap.set(this.properties.maxBounds, this);
        return this;
    }

    async attPath() {
        if (!this.aggro || this.time < 20 || this.prevMainPoly === this.mainChar.poly || this.time - this.LastPathTime < 1.0)
            return;
        this.moving = false;
        const searchPoly = this.mainChar.finalPoly ?? this.mainChar.poly;
        this.path = await this.findPathAsync(this.map, this.poly, searchPoly);

        if (this.path && this.path.length > 0) {
            this.i = 0;
            [this.TArr, this.TRotArr] = Physics.getT(this.path, 0.015, this.initRot);
            this.prevMainPoly = searchPoly;
        }
        this.moving = true;
        this.LastPathTime = this.time;
    }

    async findPathAsync(map, start, end) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const path = Physics.AStar.FindPath(start, end);
                resolve(path);
            }, 0);
        });
    }
    async moveAtRandom() {
        if (this.moving || this.aggro || this.atk)
            return;
        return new Promise(() => {
            setTimeout(() => {
                let lst = [this.poly];
                const pathSize = Math.floor(Math.random() * (200 - 100 + 1) + 100) ;
                for (let i = 0; i < pathSize; i++) {
                    const uniqueNeighbors = this.arrayDiff(Array.from(lst[lst.length - 1].neighbors), lst);
                    const random = Math.floor(Math.random() * uniqueNeighbors.length);
                    uniqueNeighbors[random].point = uniqueNeighbors[random].centroid;
                    lst.push(uniqueNeighbors[random]);
                }
                this.path = lst;
                this.i = 0;
                this.moving = true;
                [this.TArr, this.TRotArr] = Physics.getT(this.path, 0.35, this.initRot);
            },
            3000 * parseInt(this.name));
        })
    }


    arrayDiff(a, b) {
        return a.filter(
            function(el) {
                return b.indexOf(el) < 0;
            }
        );
    }
    getSqrDistance() {
        const charPos = this.mainChar.poly.point;
        const mobPos = this.poly.point;
        return Physics.DistanceSquared(charPos, mobPos);
    }

    move() {
        if (this.TRotArr.length === 0 || !this.path)
            return;
        const path = this.path;
        const i = this.i;

        const t = Math.min((this.time - this.TArr[i]) / (this.TArr[i + 1] - this.TArr[i]), 1);

        quat.slerp(this.rotation, this.rotation, this.TRotArr[i], t);
        vec3.lerp(this.properties.TF.translation, path[i].point, path[i + 1].point, t);

        this.properties.maxBounds.x = this.properties.TF.translation[0];
        this.properties.maxBounds.y = this.properties.TF.translation[1] + this.properties.maxBounds.halfHeight;
        this.properties.maxBounds.z = this.properties.TF.translation[2];

        if (t >= 1) {
            this.i++;
            this.poly = path[this.i];
            if (this.i >= this.path.length - 1) {
                this.poly = path[path.length - 1];
                this.TRotArr = [];
                this.TArr = [];
                this.path = [];
                this.moving = false;
                this.aggro = false;
            }
        }
    }

    attack() {
        if (!this.atk || this.time - this.LastAtkTime < 0.4 || this.mainChar.Attr.Health === 0)
            return;
        this.LastAtkTime = this.time;
        const Div = this.mainChar.divObjects.Health;
        const healthDiff = this.Attr.Attack - this.mainChar.Attr.Defense;
        this.mainChar.Attr.Health = Math.max(this.mainChar.Attr.Health - healthDiff, 0);
        this.mainChar.divObjects.CharHUD.childNodes[1].innerText = `${this.mainChar.Attr.Health}/${this.mainChar.Attr.MaxHealth}`;
        const width = this.mainChar.Attr.Health / this.mainChar.Attr.MaxHealth;
        HTML.ReCalcImage(Div, new HTML.ImgObject({width: width, visible: true}));
    }

    findAggro() {
        const dist = this.getSqrDistance();
        if (dist < (this.aggroRng * this.aggroRng))
            this.aggro = true;
        this.atk = dist <= this.Attr.AttackRange;
    }

    fromWorldToPixel(worldCoords) {
        const eyeSpace = vec3.transformMat4(vec3.create(), worldCoords, Scene.getGlobalViewMatrix(this.mainChar.properties.camera));
        const projSpace = vec3.transformMat4(vec3.create(), eyeSpace, Scene.getProjectionMatrix(this.mainChar.properties.camera));


        const NDCx = projSpace[0];
        const NDCy = projSpace[1];

        const canvasRect = this.mainChar.canvas.getBoundingClientRect();

        let pixelX = ((NDCx + 1) * 0.5 * canvasRect.width) + canvasRect.left;
        let pixelY = ((1 - NDCy) * 0.5 * canvasRect.height) + canvasRect.top;

        return [pixelX, pixelY];
    }

    showAboveHealth() {
        const bounds = this.properties.maxBounds;
        const pixelCoords = this.fromWorldToPixel(vec3.add(vec3.create(), [bounds.x, bounds.y, bounds.z], [0, 2 * bounds.halfHeight, 0]));
        const boundRect = this.mainChar.canvas.getBoundingClientRect();

        if (pixelCoords[0] < 0 || pixelCoords[1] < 0 || pixelCoords[0] >= boundRect.width || pixelCoords[1] >= boundRect.height) {
            this.divObjects.AboveHealth.hidden = true;
            this.divObjects.AboveHud.hidden = true
            return;
        }

        const HudImgWidth = parseInt(this.divObjects.AboveHud.childNodes[0].style.width);

        HTML.ReCalcImage(this.divObjects.AboveHud, new HTML.ImgObject(
            {x: pixelCoords[0] - HudImgWidth, y: pixelCoords[1], visible: true}))
        HTML.ReCalcImage(this.divObjects.AboveHealth, new HTML.ImgObject(
            {x: pixelCoords[0] - HudImgWidth + 6, y: pixelCoords[1] + 3, /* +6 and +3 to center in HUD*/
                width: this.Attr.Health / this.Attr.MaxHealth, visible: true}))
    }

    update(time, dt) {
        this.time = time;
        this.findAggro();
        this.attPath().then(() => {});
        this.move();
        this.attack();
        if ((this.getSqrDistance() < 400 || this.mainChar.selectedMob === this) && this.Attr.Health > 0)
            this.showAboveHealth();
        else {
            this.divObjects.AboveHealth.hidden = true;
            this.divObjects.AboveHud.hidden = true
        }
        this.moveAtRandom();
    }
}