"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  vec2 p = uv * 3.0;
  for (int i = 1; i < 6; i++) {
    float fi = float(i);
    p.x += 0.55 / fi * sin(fi * 2.5 * p.y + u_time * 0.9 + m.x * 2.0);
    p.y += 0.55 / fi * cos(fi * 2.5 * p.x + u_time * 0.7 + m.y * 2.0);
  }

  float v = sin(p.x + p.y) * 0.5 + 0.5;
  float ridge = pow(1.0 - abs(sin(p.x * 2.0 - p.y * 2.0)), 6.0);

  vec3 col = mix(vec3(0.03, 0.04, 0.05), vec3(0.1, 0.35, 0.32), v);
  col += vec3(0.78, 1.0, 0.3) * ridge * 0.85;
  col += vec3(0.37, 0.92, 0.83) * pow(v, 4.0) * 0.45;

  fragColor = vec4(col, 1.0);
}`;

export function PlasmaTokamakShader({
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
      aria-label="Magnetic confinement tokamak plasma turbulence shader"
    />
  );
}
