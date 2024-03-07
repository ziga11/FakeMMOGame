export class Skin {
    constructor({
        joints,
        inverseBindMatrices
    } = {}) {
        this.joints = joints;
        this.inverseBindMatrices = inverseBindMatrices;
    }
}