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

  vec3 col = vec3(0.02, 0.015, 0.03);

  for (float i = 1.0; i <= 6.0; i++) {
    float x0 = (i - 3.5) * 0.16;
    float sway = sin(uv.y * 5.0 + uTime * (1.8 + i * 0.2) + i) * 0.08 * (uv.y + 0.5);
    sway += (m.x - x0) * exp(-length(uv - m) * 3.5) * 0.35;
    float width = (0.45 - uv.y) * 0.035;
    float d = abs(uv.x - (x0 + sway));

    float tentacle = smoothstep(width, width * 0.2, d) * step(uv.y, 0.38);
    float rim = exp(-abs(d - width * 0.7) * 85.0) * step(uv.y, 0.38);

    col = mix(col, vec3(0.01, 0.005, 0.015), tentacle);
    col += vec3(0.68, 0.18, 0.95) * rim * 0.75;
  }

  fragColor = vec4(col, 1.0);
}`;

export function OglDemonicVoidTendrils({ speed = 1, className }: { speed?: number; className?: string }) {
  const ref = useOGL({ fragment: FRAGMENT, speed });
  return <canvas ref={ref} className={cn("h-full w-full block cursor-crosshair", className)} aria-label="OGL Demonic Void Shadow Tendrils" />;
}
