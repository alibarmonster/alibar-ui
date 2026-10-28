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

  vec3 col = vec3(0.025, 0.03, 0.04);

  for (float i = 0.0; i < 12.0; i++) {
    float z = fract(i / 12.0 - u_time * 0.15);
    float scale = mix(0.2, 3.8, z);
    vec2 p = (uv - m * 0.3 * (1.0 - z)) * scale;

    float wave = sin(p.x * 3.5 + u_time + i) * 0.18 + cos(p.x * 7.0 - u_time * 1.3) * 0.05;
    float curtain = exp(-abs(p.y - wave) * 14.0) * smoothstep(0.0, 0.3, p.y - wave + 0.25);
    float fade = sin(z * 3.14159);

    vec3 aurora = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), i / 12.0);
    col += aurora * curtain * fade * 0.28;
  }

  fragColor = vec4(1.0 - exp(-col * 1.4), 1.0);
}`;

export function AuroraBorealisVeilShader({
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
      aria-label="Volumetric geomagnetic aurora borealis curtains shader"
    />
  );
}
