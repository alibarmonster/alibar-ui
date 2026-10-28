"use client";

import { useOGL } from "@/hooks/use-ogl";
import { cn } from "@/lib/utils";

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
in vec2 vUv;
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

  vec2 q = uv - vec2(m.x * 0.4, -0.35);
  float n = fbm(vec2(q.x * 3.5, q.y * 2.5 - uTime * 2.2));
  float n2 = fbm(vec2(q.x * 6.0 + n * 1.5, q.y * 4.5 - uTime * 3.4));
  float flame = clamp(1.1 - length(vec2(q.x * (1.8 - q.y * 0.8), (q.y - 0.15) * 0.9)) - n2 * 0.65, 0.0, 1.0);

  vec3 abyss = vec3(0.02, 0.01, 0.015);
  vec3 crimson = vec3(0.55, 0.04, 0.02);
  vec3 ember = vec3(0.98, 0.32, 0.04);
  vec3 core = vec3(1.0, 0.88, 0.45);

  vec3 col = mix(abyss, crimson, smoothstep(0.05, 0.35, flame));
  col = mix(col, ember, smoothstep(0.35, 0.7, flame));
  col = mix(col, core, smoothstep(0.7, 0.96, flame));

  fragColor = vec4(col, 1.0);
}`;

export function OglAbyssalHellfire({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Abyssal Hellfire Pyre" />;
}
