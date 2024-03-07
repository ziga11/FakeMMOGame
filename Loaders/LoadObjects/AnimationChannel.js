export class AnimationChannel {
    constructor({
        targetNode,
        target,
        sampler
    } = {}) {
        this.targetNode = targetNode;
        this.target = target;
        this.sampler = sampler;
    }
}