"use client";

import { useOGL } from "@/hooks/use-ogl";
import { cn } from "@/lib/utils";

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
out vec4 fragColor;

mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  vec2 p = uv - m * 0.2;
  float r = length(p);

  float outerRing = abs(r - 0.36) - 0.004;
  float innerRing = abs(r - 0.26) - 0.003;

  vec2 p1 = p * rot(uTime * 0.35);
  vec2 p2 = p * rot(-uTime * 0.35 + 0.785398);
  float octagram = min(abs(sdBox(p1, vec2(0.18))), abs(sdBox(p2, vec2(0.18))));

  float runeTick = abs(sin(atan(p.y, p.x) * 24.0 + uTime * 2.0)) * step(abs(r - 0.31), 0.025);
  float sigil = smoothstep(0.01, 0.0, min(min(outerRing, innerRing), octagram)) + runeTick * 0.65;
  float glow = 0.006 / (min(abs(outerRing), octagram) + 0.006);

  vec3 col = vec3(0.025, 0.015, 0.02);
  vec3 ember = mix(vec3(0.88, 0.14, 0.05), vec3(1.0, 0.75, 0.22), sigil);
  col += ember * (sigil + glow * 0.45);

  fragColor = vec4(col, 1.0);
}`;

export function OglEldritchRuneSigil({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Eldritch Rune Summoning Sigil" />;
}
