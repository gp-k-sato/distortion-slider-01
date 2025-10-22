varying vec2 vUv;
uniform float uTime;

void main() {
  vUv = uv;
  vec3 pos = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}