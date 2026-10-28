"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

mat2 rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * 2.0;

  vec2 p = uv * 2.4;
  float r = length(p);
  float a = atan(p.y, p.x);

  float slices = 6.0;
  float sector = 6.28318 / slices;
  a = mod(a, sector);
  a = abs(a - sector * 0.5);
  p = vec2(cos(a), sin(a)) * r;

  for (int i = 0; i < 4; i++) {
    p = abs(p) - vec2(0.32 + m.x * 0.05, 0.28 + m.y * 0.05);
    p *= rot(u_time * 0.25 + float(i) * 0.4);
  }

  float d = min(abs(p.x), abs(p.y));
  float facet = smoothstep(0.05, 0.0, d);
  float glow = exp(-length(p) * 3.5);

  vec3 col = vec3(0.03, 0.035, 0.042);
  col += vec3(0.37, 0.92, 0.83) * glow * 0.55;
  col += vec3(0.78, 1.0, 0.3) * facet * 0.9;

  fragColor = vec4(col, 1.0);
}`;

export function CrystalKaleidoscopePrismShader({
  speed = 1,
  className,
}: {
  speed?: number;
  className?: string;
}) {
  const canvasRef = useGLSL({ fragmentShader: FRAGMENT_SHADER, speed });
  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full block cursor-crosshair", className)}
      aria-label="Dihedral symmetry crystal kaleidoscope refraction shader"
    />
  );
}
