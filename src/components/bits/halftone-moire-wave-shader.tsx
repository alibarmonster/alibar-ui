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
  vec2 cell = vec2(6.0, 6.0);
  vec2 grid = floor(gl_FragCoord.xy / cell);
  vec2 local = fract(gl_FragCoord.xy / cell) - 0.5;
  vec2 uv = (grid * cell - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  float d1 = length(uv - vec2(sin(u_time * 0.7) * 0.25, cos(u_time * 0.5) * 0.15));
  float d2 = length(uv - m);

  float w = sin(d1 * 18.0 - u_time * 4.0) + sin(d2 * 22.0 - u_time * 5.0);
  float amp = clamp(w * 0.25 + 0.5, 0.05, 0.46);

  float dotMask = smoothstep(amp, amp - 0.08, length(local));
  vec3 col = mix(vec3(0.03, 0.035, 0.042), mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), amp * 2.0), dotMask);

  fragColor = vec4(col, 1.0);
}`;

export function HalftoneMoireWaveShader({
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
      aria-label="Halftone CMYK-style moire dot interference wave shader"
    />
  );
}
