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

  vec2 c = vec2(-0.745, 0.186) + vec2(cos(u_time * 0.35), sin(u_time * 0.28)) * 0.04 + m * 0.08;
  vec2 z = uv * 2.4;

  float iter = 0.0;
  const float maxIter = 42.0;
  for (float i = 0.0; i < maxIter; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 16.0) break;
    iter += 1.0;
  }

  float smoothIter = iter < maxIter ? (iter - log2(log2(dot(z, z))) + 4.0) / maxIter : 0.0;
  vec3 col = vec3(0.025, 0.03, 0.038);
  vec3 glow = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), sin(smoothIter * 6.28) * 0.5 + 0.5);
  col += glow * pow(smoothIter, 0.75) * 1.1;

  fragColor = vec4(col, 1.0);
}`;

export function FractalJuliaSingularityShader({
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
      aria-label="Dynamic complex-plane Julia fractal singularity shader"
    />
  );
}
