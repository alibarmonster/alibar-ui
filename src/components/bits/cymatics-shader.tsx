"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_drive;
out vec4 fragColor;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  float n = 3.0 + floor(mod(u_time * 0.35, 4.0)) + m.x * 2.0;
  float k = 5.0 + floor(mod(u_time * 0.22 + 1.5, 4.0)) + m.y * 2.0;

  vec2 p = uv * (2.6 + u_drive * 0.8);
  float pi = 3.14159265359;

  float mode1 = cos(n * pi * p.x) * cos(k * pi * p.y) - cos(k * pi * p.x) * cos(n * pi * p.y);
  float mode2 = sin((n + 1.0) * pi * p.x + u_time * 0.8) * sin((k - 1.0) * pi * p.y - u_time * 0.8);
  float field = abs(mix(mode1, mode2, 0.35));

  float nodalLine = smoothstep(0.16, 0.0, field);
  float secondary = smoothstep(0.38, 0.08, field) * 0.35;

  float distMouse = length(uv - m);
  float cursorGlow = exp(-distMouse * 4.2);

  vec3 bg = vec3(0.035, 0.038, 0.045);
  vec3 sand = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), cursorGlow);
  vec3 col = bg + sand * (nodalLine * 0.95 + secondary);

  fragColor = vec4(col, 1.0);
}`;

export interface CymaticsShaderProps {
  speed?: number;
  drive?: number;
  className?: string;
}

export function CymaticsShader({
  speed = 1,
  drive = 0.7,
  className,
}: CymaticsShaderProps) {
  const canvasRef = useGLSL({
    fragmentShader: FRAGMENT_SHADER,
    speed,
    uniforms: { u_drive: drive },
  });

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full block cursor-crosshair", className)}
      aria-label="Chladni acoustic cymatics resonance plate shader"
    />
  );
}
