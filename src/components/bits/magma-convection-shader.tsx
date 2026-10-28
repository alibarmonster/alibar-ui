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

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  vec2 p = uv * 4.2 + m;
  float n = noise(p + u_time * 0.25) * 0.6 + noise(p * 2.3 - u_time * 0.35) * 0.4;
  float crack = 1.0 - smoothstep(0.0, 0.12, abs(n - 0.5));

  vec3 crust = vec3(0.05, 0.055, 0.065);
  vec3 lava = mix(vec3(0.95, 0.35, 0.08), vec3(0.78, 1.0, 0.3), pow(crack, 2.5));

  vec3 col = mix(crust, lava, crack);
  fragColor = vec4(col, 1.0);
}`;

export function MagmaConvectionShader({
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
      aria-label="Volcanic magma convection crust and fissure shader"
    />
  );
}
