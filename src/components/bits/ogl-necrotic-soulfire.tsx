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

  vec2 p = uv * 2.5 - vec2(m.x * 0.8, uTime * 1.4);
  float q = fbm(p);
  float f = fbm(p + q * 2.2 + vec2(0.0, -uTime * 1.2));

  float mask = clamp(f * 1.4 - length(uv - vec2(m.x * 0.3, -0.15)) * 0.9, 0.0, 1.0);

  vec3 darkCrypt = vec3(0.02, 0.03, 0.025);
  vec3 deepTeal = vec3(0.04, 0.28, 0.22);
  vec3 necroGreen = vec3(0.35, 0.96, 0.42);
  vec3 wraithWhite = vec3(0.85, 1.0, 0.9);

  vec3 col = mix(darkCrypt, deepTeal, smoothstep(0.1, 0.45, mask));
  col = mix(col, necroGreen, smoothstep(0.45, 0.78, mask));
  col = mix(col, wraithWhite, smoothstep(0.78, 0.98, mask));

  fragColor = vec4(col, 1.0);
}`;

export function OglNecroticSoulfire({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Necrotic Soulfire Wisp" />;
}
