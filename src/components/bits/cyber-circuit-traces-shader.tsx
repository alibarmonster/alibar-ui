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

  vec2 p = uv * 7.0;
  vec2 id = floor(p);
  vec2 f = fract(p) - 0.5;

  float h = hash(id);
  if (h > 0.5) f.x = -f.x;

  float d1 = abs(length(f - 0.5) - 0.5);
  float d2 = abs(length(f + 0.5) - 0.5);
  float d = min(d1, d2);

  float trace = smoothstep(0.09, 0.03, d);
  float pulse = sin((id.x + id.y) * 1.4 - u_time * 3.5 + length(uv - m) * 6.0) * 0.5 + 0.5;
  float packet = smoothstep(0.06, 0.0, d) * pow(pulse, 4.0);

  vec3 col = vec3(0.03, 0.035, 0.042);
  col += vec3(0.14, 0.28, 0.26) * trace;
  col += vec3(0.78, 1.0, 0.3) * packet * 1.6;

  fragColor = vec4(col, 1.0);
}`;

export function CyberCircuitTracesShader({
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
      aria-label="Truchet PCB circuit traces and data packet shader"
    />
  );
}
