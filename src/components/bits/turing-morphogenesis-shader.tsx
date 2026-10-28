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

  vec2 p = uv * 4.5 + m * 1.5;
  float v = 0.0;
  for (int i = 0; i < 4; i++) {
    v += sin(p.x * 2.2 + sin(p.y * 2.2 + u_time * 1.1));
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 1.35;
  }

  float coral = smoothstep(-0.15, 0.15, sin(v * 2.4));
  float rim = exp(-abs(sin(v * 2.4)) * 12.0);

  vec3 bg = vec3(0.03, 0.035, 0.042);
  vec3 body = vec3(0.08, 0.18, 0.17);
  vec3 edge = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), 0.6);

  vec3 col = mix(bg, body, coral) + edge * rim * 0.9;
  fragColor = vec4(col, 1.0);
}`;

export function TuringMorphogenesisShader({
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
      aria-label="Turing reaction-diffusion morphogenesis coral shader"
    />
  );
}
