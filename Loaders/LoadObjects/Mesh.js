export class Mesh {

    constructor({
        accessors = null,
        vertices = [],
        indices = [],
    } = {}) {
        this.accessors = accessors;
        this.vertices = vertices;
        this.indices = indices;
    }
}
