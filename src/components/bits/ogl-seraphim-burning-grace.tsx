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
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.04; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec2 p = uv - m * 0.25;
  float r = length(p);
  float a = atan(p.y, p.x);

  float rays = pow(abs(sin(a * 6.0 + uTime * 0.8) * cos(a * 4.0 - uTime * 0.5)), 2.5);
  float fire = fbm(p * 4.0 - vec2(0.0, uTime * 1.8));
  float halo = exp(-abs(r - 0.22) * 11.0) * (0.6 + 0.6 * fire);
  float godRay = rays * exp(-r * 2.8) * (0.5 + 0.5 * fire);

  vec3 col = vec3(0.025, 0.02, 0.015);
  col += vec3(0.85, 0.45, 0.08) * godRay * 0.9;
  col += vec3(1.0, 0.85, 0.35) * halo * 1.5;

  fragColor = vec4(1.0 - exp(-col * 1.3), 1.0);
}`;

export function OglSeraphimBurningGrace({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Seraphim Golden Grace Flames" />;
}
