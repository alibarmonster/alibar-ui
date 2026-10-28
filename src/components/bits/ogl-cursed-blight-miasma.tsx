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
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec2 p = uv * 2.5 - m * 0.5;
  float fog = fbm(p + vec2(uTime * 0.2, -uTime * 0.15));
  float mist = fbm(p * 1.8 - vec2(uTime * 0.3, uTime * 0.2) + fog);

  vec3 col = mix(vec3(0.02, 0.015, 0.025), vec3(0.18, 0.06, 0.28), mist);
  for (float i = 1.0; i <= 4.0; i++) {
    vec2 wispPos = vec2(sin(uTime * 0.7 * i + i), cos(uTime * 0.5 * i)) * 0.28;
    float wisp = exp(-length(uv - wispPos) * 14.0);
    col += mix(vec3(0.35, 0.95, 0.65), vec3(0.85, 0.3, 1.0), i / 4.0) * wisp * 0.75;
  }

  fragColor = vec4(col, 1.0);
}`;

export function OglCursedBlightMiasma({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Cursed Blight Miasma Fog" />;
}
