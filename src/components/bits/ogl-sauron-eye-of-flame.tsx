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

  vec2 p = uv - m * 0.25;
  vec2 iris = p * vec2(1.0, 1.8);
  float r = length(iris);
  float a = atan(iris.y, iris.x);

  float fibers = noise(vec2(a * 8.0, r * 14.0 - uTime * 2.5));
  float eyeRing = exp(-abs(r - 0.26 + fibers * 0.06) * 14.0);

  float slitWidth = 0.035 * (1.0 - clamp(p.y * p.y * 12.0, 0.0, 1.0));
  float slit = smoothstep(slitWidth, slitWidth + 0.02, abs(p.x)) * step(abs(p.y), 0.24);
  float slitRim = exp(-abs(abs(p.x) - slitWidth) * 55.0) * step(abs(p.y), 0.24);

  vec3 col = vec3(0.02, 0.01, 0.01);
  col += mix(vec3(0.85, 0.12, 0.02), vec3(1.0, 0.72, 0.15), fibers) * eyeRing * 1.4;
  col *= mix(1.0, slit, step(r, 0.26));
  col += vec3(1.0, 0.85, 0.35) * slitRim * 1.2;

  fragColor = vec4(col, 1.0);
}`;

export function OglSauronEyeOfFlame({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Eye of Flame Slit Pupil" />;
}
