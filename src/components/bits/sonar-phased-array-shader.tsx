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
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float sweep = mod(a - u_time * 2.2, 6.28318);
  float trail = exp(-sweep * 1.4) * step(r, 0.44);

  float rings = smoothstep(0.008, 0.0, abs(fract(r * 9.0) - 0.5) - 0.47) * step(r, 0.44);
  float axes = (smoothstep(0.004, 0.0, abs(uv.x)) + smoothstep(0.004, 0.0, abs(uv.y))) * step(r, 0.44);

  float targetDist = length(uv - m * 0.6);
  float ping = exp(-targetDist * 35.0) * (0.5 + 0.5 * sin(u_time * 10.0));

  vec3 col = vec3(0.025, 0.03, 0.036);
  col += vec3(0.15, 0.38, 0.34) * (rings + axes * 0.5);
  col += vec3(0.37, 0.92, 0.83) * trail * 0.55;
  col += vec3(0.78, 1.0, 0.3) * ping * 2.0;

  fragColor = vec4(col, 1.0);
}`;

export function SonarPhasedArrayShader({
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
      aria-label="Phased array sonar radar sweep and target lock shader"
    />
  );
}
