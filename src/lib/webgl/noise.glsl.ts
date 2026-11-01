/**
 * Shared GLSL ES 3.00 snippets. Concatenate the ones a shader needs before its main():
 *
 *   const fragment = `${GLSL_HASH}${GLSL_SIMPLEX}${GLSL_FBM} void main() { … }`;
 *
 * GLSL_SIMPLEX needs GLSL_HASH, and GLSL_FBM needs GLSL_SIMPLEX.
 */

/** Sine-free hashes: stable across GPUs, no visible banding. */
export const GLSL_HASH = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
`;

/** 2D simplex noise in roughly [-1, 1]. */
export const GLSL_SIMPLEX = /* glsl */ `
vec2 simplexGradient(vec2 cell) {
  float angle = hash12(cell) * 6.28318530718;
  return vec2(cos(angle), sin(angle));
}

float snoise(vec2 p) {
  const float F2 = 0.36602540378; // (sqrt(3) - 1) / 2
  const float G2 = 0.21132486540; // (3 - sqrt(3)) / 6
  vec2 cell = floor(p + (p.x + p.y) * F2);
  vec2 a = p - cell + (cell.x + cell.y) * G2;
  vec2 step1 = a.x > a.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 b = a - step1 + G2;
  vec2 c = a - 1.0 + 2.0 * G2;
  vec3 falloff = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  falloff *= falloff;
  falloff *= falloff;
  vec3 contribution = vec3(
    dot(a, simplexGradient(cell)),
    dot(b, simplexGradient(cell + step1)),
    dot(c, simplexGradient(cell + 1.0))
  );
  return 70.0 * dot(falloff, contribution);
}
`;

/** Fractal Brownian motion over simplex noise; octaves is clamped to 1–8. Roughly [-1, 1]. */
export const GLSL_FBM = /* glsl */ `
float fbm(vec2 p, int octaves) {
  const mat2 rotate = mat2(0.8, 0.6, -0.6, 0.8);
  float sum = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amplitude * snoise(p);
    p = rotate * p * 2.03 + 17.1;
    amplitude *= 0.5;
  }
  return sum;
}
`;

/** Ordered (Bayer) dither thresholds in [0, 1) for 2×2, 4×4 and 8×8 matrices. Pass pixel coordinates. */
export const GLSL_BAYER = /* glsl */ `
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x * 0.5 + a.y * a.y * 0.75);
}

float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

float bayer8(vec2 a) {
  return bayer4(0.5 * a) * 0.25 + bayer2(a);
}
`;

/** Hash, simplex and fBm together, in dependency order. */
export const GLSL_NOISE = GLSL_HASH + GLSL_SIMPLEX + GLSL_FBM;
