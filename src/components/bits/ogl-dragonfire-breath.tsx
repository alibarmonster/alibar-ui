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
  for (int i = 0; i < 5; i++) { v += a * abs(noise(p) * 2.0 - 1.0); p *= 2.1; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec2 dir = normalize(m - vec2(-0.6, -0.3) + 0.001);
  vec2 rel = uv - vec2(-0.55, -0.25);
  float along = max(0.0, dot(rel, dir));
  float perp = length(rel - dir * along);

  float cone = along * 0.38 + 0.04;
  float turb = fbm(uv * 4.5 - dir * uTime * 3.8);
  float jet = smoothstep(cone, 0.0, perp - turb * 0.16) * smoothstep(0.0, 0.15, along);

  vec3 col = vec3(0.025, 0.015, 0.02);
  col += vec3(0.85, 0.12, 0.02) * pow(jet, 1.2) * 1.2;
  col += vec3(1.0, 0.55, 0.08) * pow(jet, 2.4) * 1.4;
  col += vec3(1.0, 0.95, 0.75) * pow(jet, 5.0) * 1.6;

  fragColor = vec4(1.0 - exp(-col * 1.3), 1.0);
}`;

export function OglDragonfireBreath({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Dragonfire Breath Cone" />;
}
