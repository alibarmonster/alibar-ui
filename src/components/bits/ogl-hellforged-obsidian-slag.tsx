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
  for (int i = 0; i < 5; i++) { v += a * abs(noise(p) * 2.0 - 1.0); p *= 2.05; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec2 p = uv * 3.8 + m * 0.8;
  float vein = 1.0 - fbm(p + uTime * 0.15);
  float magma = pow(clamp(vein, 0.0, 1.0), 6.0);
  float pulse = 0.6 + 0.4 * sin(uTime * 2.5 - length(uv - m) * 6.0);

  vec3 obsidian = vec3(0.035, 0.035, 0.042);
  vec3 molten = mix(vec3(0.9, 0.15, 0.02), vec3(1.0, 0.85, 0.3), magma);

  vec3 col = obsidian + molten * magma * pulse * 2.2;
  fragColor = vec4(col, 1.0);
}`;

export function OglHellforgedObsidianSlag({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Hellforged Obsidian Magma Slag" />;
}
