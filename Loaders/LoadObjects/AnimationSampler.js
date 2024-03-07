export class AnimationSampler {
    constructor({
        input,
        output,
        interpolation = "LINEAR"
    }) {
        this.input = input;
        this.output = output;
        this.interpolation = interpolation;
    }
}