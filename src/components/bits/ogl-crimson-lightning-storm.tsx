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

  vec3 col = vec3(0.02, 0.015, 0.025);

  for (float i = -1.0; i <= 1.0; i += 1.0) {
    float xBase = i * 0.22 + m.x * 0.15;
    float jag = (noise(vec2(uv.y * 8.0 + uTime * 5.0, i * 10.0)) - 0.5) * 0.14;
    jag += (noise(vec2(uv.y * 22.0 - uTime * 9.0, i * 19.0)) - 0.5) * 0.04;
    float d = abs(uv.x - (xBase + jag));
    float bolt = 0.004 / (d + 0.0015);
    col += mix(vec3(0.95, 0.12, 0.18), vec3(1.0, 0.8, 0.45), bolt * 0.3) * bolt * 0.42;
  }

  fragColor = vec4(1.0 - exp(-col * 1.3), 1.0);
}`;

export function OglCrimsonLightningStorm({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Ancient Dragon Crimson Lightning" />;
}
