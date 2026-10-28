"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 cell = vec2(8.0, 12.0);
  vec2 grid = floor(gl_FragCoord.xy / cell);
  vec2 local = fract(gl_FragCoord.xy / cell);
  vec2 uv = (grid * cell - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  float a = atan(uv.y - m.y * 0.4, uv.x - m.x * 0.4);
  float r = length(uv - m * 0.4);
  float vortex = sin(r * 10.0 - u_time * 3.0 + a * 3.0) * 0.5 + 0.5;
  float fall = fract(hash(vec2(grid.x, 1.0)) + u_time * 0.35 - grid.y * 0.04);

  float luma = mix(vortex, fall, 0.35);

  float glyph = 0.0;
  vec2 c = abs(local - 0.5);
  if (luma > 0.8) glyph = step(max(c.x, c.y), 0.38);
  else if (luma > 0.6) glyph = step(abs(c.x - c.y), 0.14);
  else if (luma > 0.4) glyph = step(c.y, 0.12) * step(c.x, 0.35);
  else if (luma > 0.2) glyph = step(length(c), 0.16);

  vec3 bg = vec3(0.03, 0.035, 0.04);
  vec3 fg = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), smoothstep(0.3, 0.9, luma));

  fragColor = vec4(mix(bg, fg, glyph * luma), 1.0);
}`;

export function AsciiMatrixRainShader({
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
      aria-label="Procedural ASCII character glyph vortex shader"
    />
  );
}
