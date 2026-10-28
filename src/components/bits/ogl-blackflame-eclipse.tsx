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
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.1; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec2 p = uv - m * 0.35;
  float r = length(p);
  float a = atan(p.y, p.x);

  float wisp = fbm(vec2(p.x * 3.0 + sin(uTime + p.y * 2.0), p.y * 2.5 - uTime * 1.8));
  float outerFlame = exp(-abs(r - 0.22 + wisp * 0.14) * 9.0);
  float blackCore = smoothstep(0.14, 0.24, r + wisp * 0.08);
  float violetRim = exp(-abs(r - 0.18 + wisp * 0.09) * 18.0);

  vec3 bg = vec3(0.03, 0.02, 0.045);
  vec3 purple = vec3(0.45, 0.08, 0.85);
  vec3 crimson = vec3(0.88, 0.12, 0.28);

  vec3 col = bg + (purple * outerFlame + crimson * violetRim * 1.3) * blackCore;
  col *= smoothstep(0.06, 0.16, r + wisp * 0.05);

  fragColor = vec4(col, 1.0);
}`;

export function OglBlackflameEclipse({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Amaterasu Blackflame Aura" />;
}
