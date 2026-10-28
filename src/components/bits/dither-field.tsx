"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_scale;
out vec4 fragColor;

const float bayer[16] = float[16](
   0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
  12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
   3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
  15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
);

void main() {
  float px = max(2.0, floor(u_scale));
  vec2 gridCoord = floor(gl_FragCoord.xy / px);
  vec2 uv = (gridCoord * px) / u_resolution.xy;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

  vec2 p = (uv - 0.5) * aspect;
  vec2 m = (u_mouse - 0.5) * aspect;

  float d = length(p - m);
  float wave = sin(d * 14.0 - u_time * 3.2) * 0.5 + 0.5;
  float swirl = sin(p.x * 6.0 + sin(p.y * 5.0 + u_time)) * 0.5 + 0.5;
  float glow = exp(-d * 3.2);

  float luma = mix(wave * 0.65, swirl, 0.45) * 0.75 + glow * 0.65;

  int xi = int(mod(gridCoord.x, 4.0));
  int yi = int(mod(gridCoord.y, 4.0));
  float threshold = bayer[yi * 4 + xi];

  float bit = step(threshold, luma);
  vec3 offCol = vec3(0.035, 0.039, 0.045);
  vec3 onCol = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), clamp(glow * 1.4, 0.0, 1.0));

  fragColor = vec4(mix(offCol, onCol, bit), 1.0);
}`;

export interface DitherFieldProps {
  speed?: number;
  pixelSize?: number;
  className?: string;
}

export function DitherField({
  speed = 1,
  pixelSize = 4,
  className,
}: DitherFieldProps) {
  const canvasRef = useGLSL({
    fragmentShader: FRAGMENT_SHADER,
    speed,
    uniforms: { u_scale: pixelSize },
  });

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full block cursor-crosshair", className)}
      aria-label="Ordered Bayer 4x4 WebGL dither field"
    />
  );
}
