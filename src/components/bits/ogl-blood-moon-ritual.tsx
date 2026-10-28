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
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  float moonDist = length(uv - vec2(m.x * 0.4, 0.08));
  float moon = smoothstep(0.28, 0.265, moonDist);
  float corona = exp(-max(0.0, moonDist - 0.26) * 5.5);

  float craters = fbm(uv * 8.0);
  float clouds = fbm(vec2(uv.x * 2.5 + uTime * 0.25, uv.y * 3.5));

  vec3 sky = vec3(0.025, 0.01, 0.018) + vec3(0.45, 0.03, 0.06) * corona;
  vec3 crimsonMoon = mix(vec3(0.65, 0.04, 0.06), vec3(0.98, 0.22, 0.12), craters);

  vec3 col = mix(sky, crimsonMoon, moon);
  col = mix(col, vec3(0.015, 0.008, 0.012), smoothstep(0.35, 0.85, clouds) * 0.82);

  fragColor = vec4(col, 1.0);
}`;

export function OglBloodMoonRitual({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Blood Moon Ritual Sky" />;
}
