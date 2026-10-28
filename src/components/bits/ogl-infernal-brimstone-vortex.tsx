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

  vec2 p = uv - vec2(m.x * 0.3, -0.32);
  float twist = p.y * 5.0 - uTime * 3.5;
  float radius = 0.06 + (p.y + 0.5) * 0.22;
  float xCenter = sin(twist) * radius * 0.4;

  float n = noise(vec2(p.x * 6.0 + twist, p.y * 4.0 - uTime * 2.5));
  float funnel = exp(-abs(p.x - xCenter) / max(0.04, radius * 0.6)) * (0.5 + 0.5 * n);

  vec3 col = vec3(0.02, 0.012, 0.015);
  col += vec3(0.75, 0.12, 0.02) * funnel * 1.1;
  col += vec3(1.0, 0.65, 0.15) * pow(funnel, 2.5) * 1.4;

  fragColor = vec4(1.0 - exp(-col * 1.3), 1.0);
}`;

export function OglInfernalBrimstoneVortex({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Infernal Brimstone Fire Tornado" />;
}
