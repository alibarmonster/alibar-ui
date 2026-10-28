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

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec2 p = uv - m * 0.3;
  float r = length(p);
  float a = atan(p.y, p.x);

  float spiral = a + 2.8 / (r + 0.06) - uTime * 2.2;
  float arms = sin(spiral * 4.0 + noise(p * 6.0) * 2.0) * 0.5 + 0.5;
  float rift = exp(-abs(r - 0.2) * 8.0) * arms;
  float eye = smoothstep(0.08, 0.14, r);

  vec3 col = vec3(0.015, 0.01, 0.025);
  col += mix(vec3(0.28, 0.04, 0.55), vec3(0.75, 0.18, 0.95), arms) * rift * 1.5 * eye;

  fragColor = vec4(col, 1.0);
}`;

export function OglShadowAbyssMaelstrom({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Shadow Abyss Maelstrom" />;
}
