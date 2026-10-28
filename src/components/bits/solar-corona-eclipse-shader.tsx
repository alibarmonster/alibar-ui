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

  vec2 p = uv * 2.0;
  float r = length(p);
  float a = atan(p.y, p.x);

  float corona = 0.0;
  for (float i = 1.0; i <= 5.0; i++) {
    corona += sin(a * (4.0 * i) + u_time * (0.7 * i) + r * 6.0) / i;
  }

  float sun = exp(-max(0.0, r - 0.34) * (7.5 - corona * 1.4));
  vec2 moonPos = m * 0.35;
  float moon = smoothstep(0.33, 0.345, length(p - moonPos));
  float diamond = exp(-length(p - normalize(moonPos + 0.001) * 0.34) * 18.0);

  vec3 col = vec3(0.02, 0.025, 0.032);
  col += mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), clamp(corona * 0.5 + 0.5, 0.0, 1.0)) * sun * moon;
  col += vec3(0.92, 1.0, 0.65) * diamond * 1.4;

  fragColor = vec4(1.0 - exp(-col * 1.3), 1.0);
}`;

export function SolarCoronaEclipseShader({
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
      aria-label="Total solar eclipse corona plasma flare shader"
    />
  );
}
