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
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec2 p = uv * 3.0 - vec2(m.x, uTime * 1.6);
  float n = fbm(p + fbm(p - vec2(0.0, uTime * 1.2)));
  float frost = clamp(n * 1.3 - length(uv - vec2(m.x * 0.3, -0.1)) * 0.85, 0.0, 1.0);

  vec3 col = mix(vec3(0.015, 0.02, 0.04), vec3(0.06, 0.25, 0.65), smoothstep(0.1, 0.45, frost));
  col = mix(col, vec3(0.25, 0.78, 1.0), smoothstep(0.45, 0.78, frost));
  col = mix(col, vec3(0.92, 0.98, 1.0), smoothstep(0.78, 0.98, frost));

  fragColor = vec4(col, 1.0);
}`;

export function OglGhostfireLichCrown({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Ghostfire Lich Cold Flame" />;
}
