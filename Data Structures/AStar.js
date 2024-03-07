import {BinaryHeap} from "./BinaryHeap.js";
import * as Physics from "../ExportPhysics.js";
import * as Main from '../Main.js'
class NodeAttr {
    constructor({g = 0, f = 0, h = 0, visited = false, closed = false} = {}) {
        this.g = g;
        this.f = f;
        this.h = h;
        this.visited = visited;
        this.closed = closed;
    }
}

export class AStar {
    constructor() {
        this.memoization = new Map();
    }

    Heuristic(start, end) {
        const xDiff = Math.abs(start[0] - end[0]);
        const yDiff = Math.abs(start[1] - end[1]);
        const zDiff = Math.abs(start[2] - end[2]);

        return xDiff + yDiff + zDiff;
    }

    FindPath(start, end) {
        if (this.memoization.has([start.index, end.index]))
            return this.memoization.get([start.index, end.index]);

        let nodeMap = new Map([[start.index, new NodeAttr()]]);

        let openHeap = new BinaryHeap(nodeMap, Main.Globals.map);
        openHeap.push(start);
        start.parent = null;

        while (openHeap.size() > 0) {
            const currentNode = openHeap.pop();

            if (currentNode === end)
                return this.SmoothPath(this.TrackPath(currentNode));

            const memoizedPath = this.memoization.get([currentNode.index, end.index]);

            if (memoizedPath) {
                const newPath = this.TrackPath(currentNode);
                return this.SmoothPath([...newPath, ...memoizedPath.map(e => Main.Globals.map.Polygons[e])]);
            }

            const mainAttr = nodeMap.get(currentNode.index);
            mainAttr.closed = true;

            for (const neighbor of currentNode.neighbors) {
                let neighborAttr = nodeMap.get(neighbor.index);
                if (neighborAttr && neighborAttr.closed === true)
                    continue;

                if (neighborAttr === undefined) {
                    neighborAttr = new NodeAttr();
                    nodeMap.set(neighbor.index, neighborAttr);
                }

                const beenVisited = neighborAttr.visited;

                if (beenVisited && mainAttr.g >= neighborAttr.g)
                    continue;

                neighborAttr.visited = true;
                neighbor.parent = currentNode;

                if (!neighbor.centroid || !end.centroid)
                    throw new Error('Unexpected state');

                let min = this.Heuristic(neighbor.centroid, end.centroid);
                let minPoint = neighbor.centroid;
                for (const point of [...neighbor.positions]) {
                    const hVal = this.Heuristic(point, end.centroid);
                    if (hVal < min) {
                        min = hVal;
                        minPoint = point;
                    }
                }

                neighbor.point = minPoint;
                neighborAttr.h = neighborAttr.h || min;
                neighborAttr.g = mainAttr.g;
                neighborAttr.f = neighborAttr.g + neighborAttr.h;

                if (!beenVisited)
                    openHeap.push(neighbor);
                else
                    openHeap.rescoreElement(neighbor);
            }
        }
    }

    TrackPath(node) {
        let ret = []
        while (node.parent) {
            for (let i = 0; i < ret.length; i++) {
                this.memoization.set([node.index, ret[i].index], [...ret.slice(i).map(e => e.index)].reverse());
                this.memoization.set([ret[i].index, node.index], [...ret.slice(i).map(e => e.index)]);
            }
            ret.push(node);
            node = node.parent;
        }
        return ret.reverse();
    }

    SmoothPath(path) {
        let endPath = [];
        for (let i = 0; i < path.length - 2; i += 2) {
            endPath.push(path[i]);
            if (i < path.length - 4 && !Physics.checkTriangle(path[i].point, path[i + 2].point, path[i + 4].point)) {
                /* The path is NOT zigzag*/

                endPath.push(Physics.GetTPoly(path, i, i + 4, 0.25));
                endPath.push(Physics.GetTPoly(path, i, i + 4, 0.50));
                endPath.push(Physics.GetTPoly(path, i, i + 4, 0.75));

                i += 2;
            }
            else
                endPath.push(Physics.GetTPoly(path, i, i + 2, 0.5));
        }
        endPath.push(path[path.length - 1]);

        Physics.transformToSpline(endPath);

        return endPath;
    }
}
