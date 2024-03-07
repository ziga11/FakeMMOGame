import {vec3} from "../External/gl-matrix-module.js";
import * as Structure from "../ExportDataStructures.js";
import * as Physics from '../ExportPhysics.js'

export class OcTree {
    constructor(boundBox, capacity) {
        this.boundBox = boundBox;
        this.capacity = capacity;
        this.objects = [];
        this.divided = false;
    }

    subdivide() {
        const x = this.boundBox.x;
        const y = this.boundBox.y;
        const z = this.boundBox.z;
        const width = this.boundBox.halfWidth;
        const height = this.boundBox.halfHeight;
        const depth = this.boundBox.halfDepth;
        const frontTopRight = new Structure.BoundBox({
            x: x + (width / 2), y: y + (height / 2), z: z + (depth / 2),
            halfWidth: width / 2, halfHeight: height / 2, halfDepth: depth / 2});
        this.frontTopRight = new OcTree(frontTopRight, this.capacity);

        const frontTopLeft = new Structure.BoundBox({
            x: x - (width / 2), y: y + (height / 2), z: z + (depth / 2),
            halfWidth: width / 2, halfHeight: height / 2, halfDepth: depth / 2});
        this.frontTopLeft = new OcTree(frontTopLeft, this.capacity);

        const frontBotRight = new Structure.BoundBox({
            x: x + (width / 2), y: y - (height / 2), z: z + (depth / 2),
            halfWidth: width / 2, halfHeight: height / 2, halfDepth: depth / 2});
        this.frontBotRight = new OcTree(frontBotRight, this.capacity);

        const frontBotLeft = new Structure.BoundBox({
            x: x - (width / 2), y: y - (height / 2), z: z + (depth / 2),
            halfWidth: width / 2, halfHeight: height / 2, halfDepth: depth / 2});
        this.frontBotLeft = new OcTree(frontBotLeft, this.capacity);

        const backTopRight = new Structure.BoundBox({
            x: x + (width / 2), y: y + (height / 2), z: z - (depth / 2),
            halfWidth: width / 2, halfHeight: height / 2, halfDepth: depth / 2});
        this.backTopRight = new OcTree(backTopRight, this.capacity);

        const backTopLeft = new Structure.BoundBox({
            x: x - (width / 2), y: y + (height / 2), z: z - (depth / 2),
            halfWidth: width / 2, halfHeight: height / 2, halfDepth: depth / 2});
        this.backTopLeft = new OcTree(backTopLeft, this.capacity);

        const backBotRight = new Structure.BoundBox({
            x: x + (width / 2), y: y - (height / 2), z: z - (depth / 2),
            halfWidth: width / 2, halfHeight: height / 2, halfDepth: depth / 2});
        this.backBotRight = new OcTree(backBotRight, this.capacity);

        const backBotLeft = new Structure.BoundBox({
            x: x - (width / 2), y: y - (height / 2), z: z - (depth / 2),
            halfWidth: width / 2, halfHeight: height / 2, halfDepth: depth / 2});
        this.backBotLeft = new OcTree(backBotLeft, this.capacity);
        this.divided = true;
    }

    insert(object) {
        if (!this.boundBox.intersect(object))
            return;
        if (this.objects.length < this.capacity) {
            this.objects.push(object);
            return;
        }
        if (!this.divided)
            this.subdivide();
        this.frontTopRight.insert(object);
        this.frontTopLeft.insert(object);
        this.frontBotRight.insert(object);
        this.frontBotLeft.insert(object);
        this.backTopRight.insert(object);
        this.backTopLeft.insert(object);
        this.backBotRight.insert(object);
        this.backBotLeft.insert(object);
    }

    query(cuboid, found) {
        if (!this.boundBox.intersect(cuboid))
            return;
        for (const object of this.objects)
            if (cuboid.intersect(object))
                found.push(object);
        if (!this.divided)
            return;
        this.frontTopRight.query(cuboid, found);
        this.frontTopLeft.query(cuboid, found);
        this.frontBotRight.query(cuboid, found);
        this.frontBotLeft.query(cuboid, found);
        this.backTopRight.query(cuboid, found);
        this.backTopLeft.query(cuboid, found);
        this.backBotRight.query(cuboid, found);
        this.backBotLeft.query(cuboid, found);

        return found;
    }

    RayBoxCollision(ray, inversedRay, rayOrigin, square) {
        const x = square.x;
        const y = square.y;
        const z = square.z;

        const width = square.halfWidth;
        const height = square.halfHeight;
        const depth = square.halfDepth;

        const t1 = ((x - width) - rayOrigin[0]) * inversedRay[0];
        const t2 = ((x + width) - rayOrigin[0]) * inversedRay[0];
        const t3 = ((y - height) - rayOrigin[1]) * inversedRay[1];
        const t4 = ((y + height) - rayOrigin[1]) * inversedRay[1];
        const t5 = ((z - depth) - rayOrigin[2]) * inversedRay[2];
        const t6 = ((z + depth) - rayOrigin[2]) * inversedRay[2];

        const tMin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4), Math.min(t5, t6)));
        const tMax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4), Math.max(t5, t6)))

        if (tMax < 0)
            return [false, tMax];
        if (tMin > tMax)
            return [false, tMax]

        return [true, tMin];
    }

    RayTriangleCollision(Polygon, Ray, RayOrigin) {
        const det = -vec3.dot(Ray, Polygon.N);
        const invDet = 1.0 / det;

        const AO = vec3.sub(vec3.create(), RayOrigin, Polygon.positions[0]);
        const DAO = vec3.cross(vec3.create(), AO, Ray);

        const u = vec3.dot(Polygon.E2, DAO) * invDet;
        const v = -vec3.dot(Polygon.E1, DAO) * invDet;
        const t = vec3.dot(AO, Polygon.N) * invDet;

        return [(det >= 1e-6 && t >= 0 && u >= 0 && v >= 0 && (u + v) <= 1), vec3.scaleAndAdd(vec3.create(), RayOrigin, Ray, t)];
    }

    BoxRayRecursion(ray, inversedRay, rayOrigin, intersection) {
        if (!this.RayBoxCollision(ray, inversedRay, rayOrigin, this.boundBox)[0])
            return;
        for (const object of this.objects) {
            const [intersects, distance] = this.RayBoxCollision(ray, inversedRay, rayOrigin, object);
            if (intersects) {
                intersection.boxes.add(object);
                intersection.distances.add(distance);
            }
        }
        if (!this.divided)
            return;
        this.frontTopRight.BoxRayRecursion(ray, inversedRay, rayOrigin, intersection);
        this.frontTopLeft.BoxRayRecursion(ray, inversedRay, rayOrigin, intersection);
        this.frontBotRight.BoxRayRecursion(ray, inversedRay, rayOrigin, intersection);
        this.frontBotLeft.BoxRayRecursion(ray, inversedRay, rayOrigin, intersection);
        this.backTopRight.BoxRayRecursion(ray, inversedRay, rayOrigin, intersection);
        this.backTopLeft.BoxRayRecursion(ray, inversedRay, rayOrigin, intersection);
        this.backBotRight.BoxRayRecursion(ray, inversedRay, rayOrigin, intersection);
        this.backBotLeft.BoxRayRecursion(ray, inversedRay, rayOrigin, intersection);
    }

    RayTriangleRecursion(ray, rayOrigin, inversedRay, intersection) {
        if (!this.RayBoxCollision(ray, inversedRay, rayOrigin, this.boundBox)[0])
            return;
        for (const triangle of this.objects) {
            const collision = this.RayTriangleCollision(triangle, ray, rayOrigin);
            if (collision[0]) {
                const distance = Math.sqrt(Physics.DistanceSquared(collision[1], rayOrigin));
                if (distance > intersection.polyDistance)
                    return;
                intersection.poly = triangle;
                intersection.polyDistance = distance;
                intersection.point = collision[1];
            }
        }
        if (!this.divided)
            return;
        this.frontTopRight.RayTriangleRecursion(ray, rayOrigin, inversedRay, intersection);
        this.frontTopLeft.RayTriangleRecursion(ray, rayOrigin, inversedRay, intersection);
        this.frontBotRight.RayTriangleRecursion(ray, rayOrigin, inversedRay, intersection);
        this.frontBotLeft.RayTriangleRecursion(ray, rayOrigin, inversedRay, intersection);
        this.backTopRight.RayTriangleRecursion(ray, rayOrigin, inversedRay, intersection);
        this.backTopLeft.RayTriangleRecursion(ray, rayOrigin, inversedRay, intersection);
        this.backBotRight.RayTriangleRecursion(ray, rayOrigin, inversedRay, intersection);
        this.backBotLeft.RayTriangleRecursion(ray, rayOrigin, inversedRay, intersection);
    }

    clear() {
        this.objects = [];
        if (!this.divided)
            return;
        this.frontTopRight = this.frontTopLeft = this.frontBotRight = this.frontBotLeft = null;
        this.backTopRight = this.backTopLeft = this.backBotRight = this.backBotLeft = null;
        this.divided = false;
    }
}