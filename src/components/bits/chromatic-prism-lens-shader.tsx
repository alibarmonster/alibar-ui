"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

float scene(vec2 uv, float t) {
  float v = 0.0;
  for (float i = 1.0; i <= 4.0; i++) {
    vec2 center = vec2(sin(t * 0.5 * i), cos(t * 0.4 * i)) * 0.25;
    float r = length(uv - center);
    v += exp(-abs(r - 0.18 * i * 0.5) * 28.0);
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  vec2 disp = (uv - m) * 0.045;
  float r = scene(uv + disp, u_time);
  float g = scene(uv, u_time);
  float b = scene(uv - disp, u_time);

  vec3 col = vec3(0.03, 0.035, 0.042);
  col += vec3(r * 0.78, g * 1.0, b * 0.85) * 0.85;

  fragColor = vec4(col, 1.0);
}`;

export function ChromaticPrismLensShader({
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
      aria-label="Chromatic prism spectral dispersion lens shader"
    />
  );
}
