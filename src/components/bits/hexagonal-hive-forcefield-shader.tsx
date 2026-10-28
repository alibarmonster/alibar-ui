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

  vec2 p = uv * 6.5 + m;
  const vec2 s = vec2(1.0, 1.7320508);
  vec4 hC = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - hC.xy * s, p - (hC.zw + 0.5) * s);
  vec4 hex = dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + 0.5);

  vec2 a = abs(hex.xy);
  float dist = 0.5 - max(dot(a, s * 0.5), a.x);
  float border = smoothstep(0.06, 0.01, dist);

  float pulse = sin(hash(hex.zw) * 6.28 + u_time * 2.5 - length(uv - m) * 5.0) * 0.5 + 0.5;

  vec3 col = vec3(0.03, 0.035, 0.042);
  col += vec3(0.37, 0.92, 0.83) * pow(pulse, 4.0) * 0.45;
  col += mix(vec3(0.18, 0.32, 0.3), vec3(0.78, 1.0, 0.3), pow(pulse, 3.0)) * border;

  fragColor = vec4(col, 1.0);
}`;

export function HexagonalHiveForcefieldShader({
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
      aria-label="Hexagonal honeycomb energy shield forcefield shader"
    />
  );
}
