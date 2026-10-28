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
  float wingCurve = abs(p.x) * 1.4 - p.y * 0.8;
  float plume = fbm(vec2(abs(p.x) * 4.5 - uTime * 1.8, p.y * 3.5 - uTime * 2.2));
  float wing = exp(-abs(wingCurve - 0.22 + plume * 0.25) * 6.5) * smoothstep(0.0, 0.45, abs(p.x));
  float core = exp(-length(p) * 9.0);

  vec3 col = vec3(0.03, 0.015, 0.01);
  col += vec3(0.92, 0.22, 0.03) * wing * 1.2;
  col += vec3(1.0, 0.78, 0.25) * (pow(wing, 2.5) + core) * 1.4;

  fragColor = vec4(1.0 - exp(-col * 1.3), 1.0);
}`;

export function OglPhoenixRebirthPlume({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Phoenix Rebirth Solar Plume" />;
}
