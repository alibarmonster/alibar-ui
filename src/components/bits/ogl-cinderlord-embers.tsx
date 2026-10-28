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

  vec3 col = vec3(0.03, 0.02, 0.022);
  float hearth = exp(-max(0.0, uv.y + 0.55) * 4.5);
  col += vec3(0.45, 0.08, 0.02) * hearth;

  for (float i = 1.0; i <= 4.0; i++) {
    vec2 p = uv * (3.5 + i * 2.2);
    p.y -= uTime * (0.8 + i * 0.4);
    p.x += sin(uTime * 0.9 + p.y * 0.7 + i) * 0.35 - m.x * i * 0.4;

    vec2 id = floor(p);
    vec2 f = fract(p) - 0.5;
    vec2 o = (vec2(hash(id), hash(id + 9.3)) - 0.5) * 0.5;
    float d = length(f - o);

    float ember = exp(-d * (16.0 + i * 3.0));
    float ash = smoothstep(0.14, 0.08, d) * step(0.65, hash(id + 3.1));
    vec3 fireCol = mix(vec3(1.0, 0.25, 0.04), vec3(1.0, 0.82, 0.25), hash(id));

    col += fireCol * ember * (1.3 / i);
    col = mix(col, vec3(0.12, 0.1, 0.1), ash * 0.5);
  }

  fragColor = vec4(col, 1.0);
}`;

export function OglCinderlordEmbers({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Cinderlord Ash & Embers" />;
}
