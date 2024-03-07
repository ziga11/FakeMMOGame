#version 300 es
precision mediump float;

uniform vec4 uStartColor;
uniform vec4 uEndColor;
uniform float uTime;

out vec4 oColor;

void main(){
    oColor = mix(uStartColor, uEndColor, cos(uTime) * 0.5 + 0.5);
}