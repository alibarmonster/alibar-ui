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

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec3 col = vec3(0.02, 0.015, 0.03);

  for (float i = 1.0; i <= 5.0; i++) {
    float t = fract(uTime * (0.45 + i * 0.07) + i * 0.23);
    vec2 center = vec2((hash(vec2(i, floor(uTime * 0.45))) - 0.5) * 0.9, 0.55) + vec2(-0.85, -1.1) * t + m * 0.25;
    vec2 dir = normalize(vec2(-0.85, -1.1));
    vec2 rel = uv - center;
    float along = clamp(dot(rel, -dir), 0.0, 0.45);
    float d = length(rel + dir * along);

    float head = exp(-length(rel) * 28.0);
    float tail = exp(-d * 42.0) * (1.0 - along / 0.45);

    vec3 meteorCol = mix(vec3(0.75, 0.15, 0.95), vec3(1.0, 0.45, 0.12), i / 5.0);
    col += meteorCol * (head * 1.6 + tail * 0.9);
  }

  fragColor = vec4(1.0 - exp(-col * 1.3), 1.0);
}`;

export function OglAstralCataclysmMeteors({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Astral Cataclysm Meteor Shower" />;
}
