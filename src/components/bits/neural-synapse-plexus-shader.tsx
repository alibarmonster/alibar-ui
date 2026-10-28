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

  for (float k = 1.0; k <= 3.0; k++) {
    vec2 p = (uv - m * 0.15 * k) * (3.5 + k);
    vec2 id = floor(p);
    vec2 f = fract(p) - 0.5;

    vec2 pt = 0.35 * sin(u_time * 0.9 + 6.28 * vec2(hash(id), hash(id + 7.1)));
    float d = length(f - pt);
    float node = exp(-d * 18.0);
    float line = smoothstep(0.03, 0.0, abs(f.x - pt.x)) * smoothstep(0.45, 0.0, abs(f.y));

    vec3 tint = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), k / 3.0);
    col += tint * (node * 0.85 + line * 0.25);
  }

  fragColor = vec4(col, 1.0);
}`;

export function NeuralSynapsePlexusShader({
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
      aria-label="Neural network axon and firing synapse plexus shader"
    />
  );
}
