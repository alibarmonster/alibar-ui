"use client";

import { useOGL } from "@/hooks/use-ogl";
import { cn } from "@/lib/utils";

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
out vec4 fragColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec2 p = uv * 2.5;
  float q = fbm(p + uTime * 0.25);
  float f = fbm(p + q * 2.5 - m * 1.2 - uTime * 0.18);

  vec3 n = normalize(vec3(dFdx(f) * 32.0, dFdy(f) * 32.0, 1.0));
  vec3 l = normalize(vec3(m.x - uv.x, m.y - uv.y, 0.6));
  float spec = pow(max(0.0, dot(reflect(-l, n), vec3(0.0, 0.0, 1.0))), 24.0);
  float diff = max(0.0, dot(n, l));

  vec3 col = mix(vec3(0.06, 0.005, 0.01), vec3(0.48, 0.02, 0.05), f);
  col += vec3(0.85, 0.08, 0.12) * diff * 0.35 + vec3(1.0, 0.65, 0.7) * spec * 0.85;

  fragColor = vec4(col, 1.0);
}`;

export function OglVampiricBloodpool({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Vampiric Crimson Bloodpool" />;
}
