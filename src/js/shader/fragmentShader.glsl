varying vec2 vUv;
uniform float uTime;
uniform sampler2D uTexCurrent;
uniform sampler2D uTexNext;
uniform sampler2D uTexDisp;
uniform vec2 uResolution;
uniform vec2 uTexResolution;
uniform float uProgress;
uniform int uDirection;
uniform float uStrength;

uniform float dispFactor;
uniform sampler2D disp;

uniform sampler2D texture1;
uniform sampler2D texture2;
uniform float angle1;
uniform float angle2;
uniform float intensity1;
uniform float intensity2;
uniform vec4 res;


float parabola( float x, float k ) {
  return pow( 4. * x * ( 1. - x ), k );
}

mat2 getRotM(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = vUv;

  vec2 ratio = vec2(
    min((uResolution.x / uResolution.y) / (uTexResolution.x / uTexResolution.y), 1.0),
    min((uResolution.y / uResolution.x) / (uTexResolution.y / uTexResolution.x), 1.0)
  );

  uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );

  // vec3 texDisp = texture2D(uTexDisp, uv).rgb;
  // float disp = texDisp.r * uStrength;
  // disp = disp * parabola(uProgress, 0.8);

  // vec2 dispUv = uv;
  // vec2 dispUv2 = uv;

  // // 右から左
  // if(uDirection == 0) {
  //   dispUv = vec2(uv.x + disp, uv.y);
  //   dispUv2 = vec2(uv.x - disp, uv.y);
  //   // 右から左（変形を小さく）
  //   // dispUv = vec2(uv.x + disp * 0.5, uv.y);
  //   // dispUv2 =  vec2(uv.x - disp * 0.5, uv.y);
  // }

  // // 上から下
  // if(uDirection == 1) {
  //   dispUv = vec2(uv.x, uv.y + disp);
  //   dispUv2 = vec2(uv.x, uv.y - disp);
  // }

  // // 右上から左下
  // if(uDirection == 2) {
  //   dispUv = vec2(uv + disp);
  //   dispUv2 = vec2(uv - disp);
  //   // 右上から左下（変形を小さく）
  //   // dispUv = uv + vec2(disp) * 0.3;
  //   // dispUv2 = uv - vec2(disp) * 0.3;
  // }

  // // 左下から右上
  // if(uDirection == 3) {
  //   dispUv = vec2(uv - disp);
  //   dispUv2 = vec2(uv + disp);
  // }


  // vec3 tex1 = texture2D(uTexCurrent, dispUv).rgb;
  // vec3 tex2 = texture2D(uTexNext, dispUv2).rgb;
  // vec3 color = mix(tex1, tex2, uProgress);

  // gl_FragColor = vec4(color, 1.0);


  vec4 disp = texture2D(disp, vUv);
  vec2 dispVec = vec2(disp.r, disp.g);

  // vec2 uv = vUv;
  vec2 distortedPosition1 = uv + getRotM(angle1) * dispVec * intensity1 * dispFactor;
  vec2 distortedPosition2 = uv + getRotM(angle2) * dispVec * intensity2 * (1.0 - dispFactor);
  vec4 _texture1 = texture2D(texture1, distortedPosition1);
  vec4 _texture2 = texture2D(texture2, distortedPosition2);
  gl_FragColor = mix(_texture1, _texture2, dispFactor);
}