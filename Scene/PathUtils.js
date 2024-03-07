import {vec3} from "../External/gl-matrix-module.js";
import * as Scene from '../ExportScene.js'
import * as Physics from '../ExportPhysics.js'

export function FindPoly(map, ray, camera) {
    const inversedRay = vec3.inverse(vec3.create(), ray);
    const intersection = {boxes: new Set(), distances: new Set(), poly: null, polyDistance: Infinity, point: Infinity}
    const matrix = Scene.getGlobalModelMatrix(camera);
    const rayOrigin = [matrix[12], matrix[13], matrix[14]];
    Physics.objectOctree.BoxRayRecursion(ray, inversedRay, rayOrigin, intersection);

    if (intersection.boxes.size === 0)
        return undefined;

    const boxArr = [...intersection.boxes];
    const distArr = [...intersection.distances];
    const zipped = boxArr.map((box, index) => ({
        box,
        distance: distArr[index]
    }));

    zipped.sort((a, b) => a.distance - b.distance);

    map.ocTreeTerrain.RayTriangleRecursion(ray, rayOrigin, inversedRay, intersection);
    if (intersection.poly === null) {
        if (intersection.boxes.size > 1)
            return Physics.boundsMap.get(zipped[1].box);
        return undefined;
    }
    if (intersection.boxes.size > 1 && zipped[1].distance < intersection.polyDistance)
        return Physics.boundsMap.get(zipped[1].box);


    return intersection.poly;
}

export function findNeighbors(polygons, polyMap) {
    for (const mainPoly of polygons) {
        const v0 = mainPoly.positions[0], v1 = mainPoly.positions[1], v2 = mainPoly.positions[2];
        const groupA = polyMap[toString(v0)];
        const groupB = polyMap[toString(v1)];
        const groupC = polyMap[toString(v2)];

        mainPoly.neighbors = new Set([...groupA, ...groupB, ...groupC]);
    }

    polygons.map(poly => {
        poly.positions.map((vec, i) => {
            const v0 = Physics.roundNumber(vec[0], 2);
            const v1 = Physics.roundNumber(vec[1], 2);
            const v2 = Physics.roundNumber(vec[2], 2);
            poly.positions[i] = [v0, v1, v2];
        });
        const centroid = vec3.create();
        vec3.add(centroid, centroid, poly.positions[0]);
        vec3.add(centroid, centroid, poly.positions[1]);
        vec3.add(centroid, centroid, poly.positions[2]);

        vec3.scale(centroid, centroid, 1 / 3);

        centroid[0] = Physics.roundNumber(centroid[0], 2);
        centroid[1] = Physics.roundNumber(centroid[1], 2);
        centroid[2] = Physics.roundNumber(centroid[2], 2);

        poly.centroid = [centroid[0], centroid[1], centroid[2]];
    });

    return buildGroups(polygons);
}

export function toString(vertex) {
    return `[${vertex[0]}, ${vertex[1]}, ${vertex[2]}]`;
}
function buildGroups(polygons) {
    let polygonGroups = [];

    for (const polygon of polygons) {
        if (polygon.group !== undefined)
            polygonGroups[polygon.group].push(polygon);
        else {
            polygon.group = polygonGroups.length;
            spreadGroupID(polygon);
            polygonGroups.push([polygon]);
        }
    }
    return polygonGroups;
}

function spreadGroupID(mainPoly) {
    let nextBatch = new Set([mainPoly]);

    while (nextBatch.size > 0) {
        const batch = nextBatch;
        nextBatch = new Set();

        for (const poly of batch) {
            poly.group = mainPoly.group;
            for (const neighbor of poly.neighbors) {
                if (neighbor.group === undefined)
                    nextBatch.add(neighbor);
            }
        }
    }
}
