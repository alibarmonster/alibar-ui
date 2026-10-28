"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

float map(vec3 p) {
  vec3 q = fract(p) * 2.0 - 1.0;
  return length(q) - 0.24;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * 0.8;

  vec3 ro = vec3(m.x, m.y, u_time * 1.4);
  vec3 rd = normalize(vec3(uv, 1.1));

  float t = 0.0;
  float glow = 0.0;
  for (int i = 0; i < 28; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    glow += 0.012 / (0.015 + d * d);
    if (d < 0.01 || t > 12.0) break;
    t += d * 0.65;
  }

  vec3 col = vec3(0.02, 0.025, 0.03) + glow * mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), 0.55) * 0.14;
  fragColor = vec4(1.0 - exp(-col * 1.4), 1.0);
}`;

export function QuantumLatticeShader({
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
      aria-label="3D raymarched infinite quantum lattice shader"
    />
  );
}
