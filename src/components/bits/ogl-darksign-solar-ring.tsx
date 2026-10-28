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
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.05; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec2 p = uv - m * 0.25;
  float r = length(p);
  float a = atan(p.y, p.x);

  float flare = fbm(vec2(a * 3.0 + uTime * 0.6, r * 4.5 - uTime * 2.4));
  float ring = exp(-abs(r - 0.23 + flare * 0.08) * 16.0);
  float eclipse = smoothstep(0.19, 0.21, r);
  float bleed = exp(-max(0.0, r - 0.2) * 5.0) * smoothstep(-0.5, 0.2, -p.y);

  vec3 col = vec3(0.02, 0.012, 0.015);
  col += vec3(0.75, 0.05, 0.02) * bleed * 0.85;
  col += mix(vec3(0.95, 0.18, 0.03), vec3(1.0, 0.82, 0.35), ring) * ring * 1.6 * eclipse;

  fragColor = vec4(col, 1.0);
}`;

export function OglDarksignSolarRing({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Darksign Eclipse Ring" />;
}
