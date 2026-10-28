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

  vec3 col = vec3(0.025, 0.03, 0.038);

  for (float l = 1.0; l <= 3.0; l++) {
    vec2 p = uv * (4.0 + l * 2.5);
    p.y -= u_time * (0.6 + l * 0.35);
    p.x += sin(u_time * 0.8 + p.y * 0.5) * 0.3 + m.x * l * 0.4;

    vec2 id = floor(p);
    vec2 f = fract(p) - 0.5;

    vec2 offset = (vec2(hash(id), hash(id + 13.7)) - 0.5) * 0.5;
    float d = length(f - offset);
    float spark = exp(-d * (14.0 + l * 4.0));
    float flicker = 0.5 + 0.5 * sin(u_time * 6.0 + hash(id) * 6.28);

    vec3 tint = mix(vec3(0.78, 1.0, 0.3), vec3(0.37, 0.92, 0.83), hash(id + 4.2));
    col += tint * spark * flicker * (1.2 / l);
  }

  fragColor = vec4(col, 1.0);
}`;

export function BioluminescentEmbersShader({
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
      aria-label="Multi-parallax rising bioluminescent embers shader"
    />
  );
}
