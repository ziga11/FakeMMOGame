#version 300 es
precision mediump float;

const float tau = 6.2831;

uniform float uTime;
uniform vec4 uStartColor;
uniform vec4 uEndColor;

out vec4 oColor;
in vec4 vPosition;
in vec3 vNormal;

void main() {
    float xOffset = cos(vPosition.x * tau * 8.0) * 0.01;
    float t = cos((vPosition.y + xOffset - sin(uTime) * 0.1) * tau * 5.0) * 0.5 + 0.5;
    t *= 1.0 - vPosition.y;

    float removeTopBot = float(abs(vNormal.y) < 0.99);
    float waves = t * removeTopBot;

    vec4 gradient = mix(uStartColor, uEndColor, vPosition.y);

    oColor = gradient * removeTopBot;
}
