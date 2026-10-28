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

  vec2 p1 = vec2(-0.22, 0.0);
  vec2 p2 = m;

  vec2 d1 = uv - p1;
  vec2 d2 = uv - p2;
  float a1 = atan(d1.y, d1.x);
  float a2 = atan(d2.y, d2.x);
  float r1 = length(d1);
  float r2 = length(d2);

  float fieldLines = sin((a1 - a2) * 10.0 + u_time * 1.8) * 0.5 + 0.5;
  float equipotential = sin(log(r1 / (r2 + 0.001)) * 6.0 - u_time * 1.2) * 0.5 + 0.5;

  float lineMask = pow(fieldLines, 8.0) + pow(equipotential, 12.0) * 0.5;
  float poleGlow = exp(-r1 * 8.0) + exp(-r2 * 8.0);

  vec3 col = vec3(0.03, 0.035, 0.042);
  col += mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), fieldLines) * lineMask * 0.85;
  col += vec3(0.78, 1.0, 0.3) * poleGlow * 0.7;

  fragColor = vec4(col, 1.0);
}`;

export function MagneticDipoleFluxShader({
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
      aria-label="Interactive magnetic dipole vector field lines shader"
    />
  );
}
