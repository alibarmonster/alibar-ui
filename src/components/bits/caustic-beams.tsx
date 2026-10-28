"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_intensity;
out vec4 fragColor;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  vec3 col = vec3(0.03, 0.035, 0.042);

  for (float i = 1.0; i <= 6.0; i++) {
    float t = u_time * (0.4 + i * 0.08);
    float curve = sin(uv.x * (2.2 + i * 0.4) + t + i * 1.3) * 0.22;
    curve += cos(uv.x * 4.5 - t * 1.2) * 0.06;
    curve += (m.y - uv.y) * exp(-abs(uv.x - m.x) * 3.0) * 0.35;

    float dist = abs(uv.y - curve);
    float beam = (0.0045 * u_intensity) / (dist + 0.003);

    vec3 tint = mix(
      vec3(0.37, 0.92, 0.83),
      vec3(0.78, 1.0, 0.3),
      sin(i * 0.9 + u_time * 0.5) * 0.5 + 0.5
    );
    col += beam * tint * 0.45;
  }

  float grid = step(0.98, fract(uv.x * 16.0)) + step(0.98, fract(uv.y * 16.0));
  col += grid * vec3(1.0) * 0.015;

  fragColor = vec4(1.0 - exp(-col * 1.35), 1.0);
}`;

export interface CausticBeamsProps {
  speed?: number;
  intensity?: number;
  className?: string;
}

export function CausticBeams({
  speed = 1,
  intensity = 1.2,
  className,
}: CausticBeamsProps) {
  const canvasRef = useGLSL({
    fragmentShader: FRAGMENT_SHADER,
    speed,
    uniforms: { u_intensity: intensity },
  });

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full block", className)}
      aria-label="WebGL caustic energy beams"
    />
  );
}
