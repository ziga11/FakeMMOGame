#version 300 es

layout (location = 0) in vec4 aPosition;
layout (location = 2) in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

out vec4 vPosition;
out vec3 vNormal;

void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
    vPosition = (uModelMatrix * aPosition).xyz;
    vNormal = uNormalMatrix * aNormal.xyz;
}