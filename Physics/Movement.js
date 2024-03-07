import * as Physics from '../ExportPhysics.js'
import * as Structure from '../ExportDataStructures.js'
import * as Main from '../Main.js'
import {quat, vec3} from "../External/gl-matrix-module.js";


export function GetTPoly(path, ind1, ind2, t) {
    const TPoint = getTPoint(path[ind1].point, path[ind2].point, t);

    let polys = new Set();
    for (let i = ind1; i <= ind2; i++)
        polys = new Set([...polys, ...path[i].neighbors]);
        /* Adding current poly is pointless, since the other neighbor will add it */

    let closestNode;
    for (const currPoly of polys) {
        if (vecInTriangle2D(TPoint, currPoly)) {
            closestNode = currPoly
            break
        }
    }

    if (!closestNode)
        closestNode = path[ind1 + Math.floor((ind2 - ind1) * t)];
        /* I have absolutely no idea why this shit here is necessary but 🤷‍♂️*/

    const closestVertex = GetClosestVertex(TPoint, closestNode);


    const distVertexCentroid = Math.sqrt(Physics.DistanceSquared(closestVertex, closestNode.centroid));
    const distVertexMidPoint = Math.sqrt(Physics.DistanceSquared(closestVertex, TPoint));

    const tVal = distVertexMidPoint / distVertexCentroid;

    TPoint[1] = vec3.lerp(vec3.create(), closestVertex, closestNode.centroid, tVal)[1];

    const poly = new Structure.Polygon();
    poly.centroid = TPoint;
    poly.point = TPoint;
    poly.positions = closestNode.positions;
    poly.neighbors = closestNode.neighbors;

    return poly;
}

export function vecInTriangle2D(point, poly) {
    const A = poly.positions[0];
    const B = poly.positions[1];
    const C = poly.positions[2];

    const APxDiff = point[0] - A[0];
    const APzDiff = point[2] - A[2];

    /* AB intersection */
    const sectAB = (B[0] - A[0]) * APzDiff - (B[2] - A[2]) * APxDiff > 0;

    /* AC intersection */
    if (((C[0] - A[0]) * APzDiff - (C[2] - A[2]) * APxDiff > 0) === sectAB)
        return false;

    /* BC intersection */
    if (((C[0] - B[0]) * (point[2] - B[2]) - (C[2] - B[2]) * (point[0] - B[0]) > 0) !== sectAB)
        return false;

    return true;
}

export function checkTriangle(point0, point1, point4) {
    /* If true the next point is to the right or to the left so forming a triangle */

    const p0p2 = vec3.sub(vec3.create(), point1, point0);
    const p0p4 = vec3.sub(vec3.create(), point4, point0);

    const p0p2X = Physics.roundNumber(p0p2[0], 2);
    const p0p2Z = Physics.roundNumber(p0p2[2], 2);
    const p0p4X = Physics.roundNumber(p0p4[0], 2);
    const p0p4Z = Physics.roundNumber(p0p4[2], 2);


    return ((p0p2X === p0p4X) || 2 * p0p2X === p0p4X) && ((p0p2Z === p0p4Z) || (2 * p0p2Z === p0p4Z));
}

export function GetClosestVertex(midPoint, poly) {
    let closestVertex, distance = Infinity;
    for (const vertex of poly.positions) {
        const currDistance = Physics.DistanceSquared(vertex, midPoint);
        if (currDistance < distance) {
            distance = currDistance;
            closestVertex = vertex;
        }
    }
    return closestVertex;
}

function getTPoint(point1, point2, t) {
    return vec3.lerp(vec3.create(), point1, point2, t);
}

export function getHermite(point1, point2, tan1, tan2, t) {
    const polyEq1 = 2 * Math.pow(t, 3) - 3 * Math.pow(t, 2) + 1;
    const b1 = vec3.scale(vec3.create(), point1, polyEq1);

    const polyEq2 = Math.pow(t, 3) - 2 * Math.pow(t, 2) + t;
    const b2 = vec3.scale(vec3.create(), tan1, polyEq2);

    const polyEq3 = -2 * Math.pow(t, 3) + 3 * Math.pow(t, 2);
    const b3 = vec3.scale(vec3.create(), point2, polyEq3);

    const polyEq4 = Math.pow(t, 3) - Math.pow(t, 2);
    const b4 = vec3.scale(vec3.create(), tan2, polyEq4);

    const endVec = vec3.add(vec3.create(), b1, b2);
    vec3.add(endVec, endVec, b3);
    vec3.add(endVec, endVec, b4);

    return endVec;
}


export function getTangent(point1, point2) {
    let tangentX, tangentY, tangentZ;

    tangentX = (point1.point[0] - point2.point[0]) / 2;
    tangentY = (point1.point[1] - point2.point[1]) / 2;
    tangentZ = (point1.point[2] - point2.point[2]) / 2;

    return vec3.fromValues(tangentX, tangentY, tangentZ);
}

export function transformToSpline(path) {
    for (let i = 0, max = 8; i < path.length - 3; i += max) {

        const tan1 = getTangent(path[i + 2], path[i]);
        const tan2 = getTangent(path[i + 3], path[i + 1]);

        const p1 = path[i];
        const p2 = path[i + 1];

        for (let j = 1; j < max; j++) {
            const c = new Structure.Polygon();
            const t = j * (1 / max);

            c.point = getHermite(p1.point, p2.point, tan1, tan2, t);
            c.centroid = c.point;
            c.neighbors = path[i + (t > 0.5)].neighbors;

            const vecDiff = vec3.fromValues(Physics.roundNumber(c.point[0] - p1.point[0], 2),
                                            Physics.roundNumber(c.point[1] - p1.point[1], 2),
                                            Physics.roundNumber(c.point[2] - p1.point[2], 2));

            c.positions = [];
            for (const pos of p1.positions)
                c.positions.push([pos[0] + vecDiff[0], pos[1] + vecDiff[1], pos[2] + vecDiff[2]]);

            path.splice(i + j, 0, c);
        }
    }
}

export function getT(path, StepSpeed, initRot) {
    let TArr = [], TRotArr = [];
    TArr.push(Main.Globals.time);

    for (let i = 0; i < path.length - 1; i++) {
        TArr.push(TArr[i] + StepSpeed);
        if (initRot)
            TRotArr.push(rotate(path[i].point, path[i + 1].point, initRot));
    }
    return [TArr, TRotArr];
}

export function rotate(fromPoint, toPoint, initRot) {
    /* Calculate Y rotation*/

    const deltaX = toPoint[0] - fromPoint[0];
    const deltaZ = toPoint[2] - fromPoint[2];

    let yAngle = Math.atan2(deltaX, deltaZ);

    const YRotationQuaternion = quat.setAxisAngle(quat.create(), [0, 1, 0], yAngle);

    return quat.mul(quat.create(), YRotationQuaternion, initRot);
}
