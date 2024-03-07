#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform vec4 uBaseFactor;
uniform sampler2D uBaseTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uSplatTexture1;
uniform sampler2D uSplatTexture2;

uniform float uSplat;
uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform sampler2D uTex3;
uniform sampler2D uTex4;
uniform sampler2D uTex5;

uniform vec3 uCameraPos;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform float uGloss;
uniform float uTime;

in vec3 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vTangent;
in vec3 vBiTangent;

out vec4 oColor;

vec3 blend3(in vec4 texture1, in float v1, in vec4 texture2, in float v2, in vec4 texture3, in float v3) {
    return texture1.rgb * v1 + texture2.rgb * v2 + texture3.rgb * v3;
}
vec3 blend6(
    in vec4 texture1, in float weight1,
    in vec4 texture2, in float weight2,
    in vec4 texture3, in float weight3,
    in vec4 texture4, in float weight4,
    in vec4 texture5, in float weight5,
    in vec4 texture6, in float weight6
) {
    vec3 result = texture1.rgb * weight1 +
                  texture2.rgb * weight2 +
                  texture3.rgb * weight3 +
                  texture4.rgb * weight4 +
                  texture5.rgb * weight5 +
                  texture6.rgb * weight6;

    return result;
}

void main() {
    mat3 TangentToWorldMatrix = mat3(
        vTangent.x, vBiTangent.x, vNormal.x,
        vTangent.y, vBiTangent.y, vNormal.y,
        vTangent.z, vBiTangent.z, vNormal.z
    );

    vec3 colorSpaceNormal = texture(uNormalTexture, vTexCoord).xyz;
    vec3 tangentSpaceNormal = (colorSpaceNormal * 2.0) - 1.0;
    vec3 N = normalize(TangentToWorldMatrix * tangentSpaceNormal);

    vec4 baseColor = vec4(0);

    if (uSplat == 1.0) {
        vec4 splatColor1 = texture(uSplatTexture1, vTexCoord);
        vec4 splatColor2 = texture(uSplatTexture2, vTexCoord);

        vec4 tex0 = texture(uTex0, vTexCoord);
        vec4 tex1 = texture(uTex1, vTexCoord);
        vec4 tex2 = texture(uTex2, vTexCoord);
        vec4 tex3 = texture(uTex3, vTexCoord);
        vec4 tex4 = texture(uTex4, vTexCoord);
        vec4 tex5 = texture(uTex5, vTexCoord);

        vec3 endBlend = blend6(tex0, clamp(splatColor1.r, 0.0, 1.0), tex1, clamp(splatColor1.g, 0.0, 1.0), tex2, clamp(splatColor1.b + .3, 0.0, 1.0),
                               tex3, clamp(splatColor2.r + .2, 0.0, 1.0), tex4, clamp(splatColor2.g + .3, 0.0, 1.0), tex5, clamp(splatColor2.b + .3, 0.0, 1.0));

        baseColor = vec4(endBlend, 1.0);
    }
    else {
        baseColor = texture(uBaseTexture, vTexCoord);
    }

    vec3 V = normalize(uCameraPos - vPosition);

    vec3 diffuse = vec3(0.0);
    vec3 specularLight = vec3(0.0);

    vec3 L = normalize(uLightPos - vPosition);
    float lambert = max(dot(N, L), 0.0);
    diffuse += lambert * uLightColor;

    if (lambert > 0.0) {
        vec3 H = normalize(L + V);
        float specular = pow(max(dot(H, N), 0.0), uGloss);
        specularLight += specular * uLightColor;
    }


    float fresnel = (1.0 - max(dot(V, N), 0.0)) * 0.2;

    vec3 ambientColor = vec3(0.6);

    diffuse = max(diffuse, 0.0);

    specularLight = max(specularLight, 0.0) * 0.5;

    oColor = baseColor * vec4(diffuse + ambientColor, 1.0) + vec4(specularLight, 1.0) + fresnel;
}