export class Material {

    constructor({
        baseTexture,
        emissionTexture,
        normalTexture,
        occlusionTexture,
        roughnessTexture,
        metalnessTexture,
        splatTexture1,
        splatTexture2,
        multipleTextures,

        baseFactor = [1, 1, 1, 1],
        emissionFactor = [0, 0, 0],
        normalFactor = 1,
        occlusionFactor = 1,
        roughnessFactor = 1,
        metalnessFactor = 1,
    } = {}) {
        this.baseTexture = baseTexture;
        this.emissionTexture = emissionTexture;
        this.normalTexture = normalTexture;
        this.occlusionTexture = occlusionTexture;
        this.roughnessTexture = roughnessTexture;
        this.metalnessTexture = metalnessTexture;
        this.multipleTextures = multipleTextures;
        this.splatTexture1 = splatTexture1;
        this.splatTexture2 = splatTexture2;

        this.baseFactor = baseFactor;
        this.emissionFactor = emissionFactor;
        this.normalFactor = normalFactor;
        this.occlusionFactor = occlusionFactor;
        this.roughnessFactor = roughnessFactor;
        this.metalnessFactor = metalnessFactor;
    }

}
