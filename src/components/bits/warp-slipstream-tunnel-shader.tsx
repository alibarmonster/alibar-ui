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

  vec2 p = uv - m * 0.25;
  float r = length(p) + 0.001;
  float a = atan(p.y, p.x);

  vec2 tc = vec2(a / 6.28318 * 8.0, 1.0 / r + u_time * 3.5);
  vec2 id = floor(tc);
  vec2 f = fract(tc) - 0.5;

  float streak = smoothstep(0.45, 0.0, abs(f.x)) * step(0.62, hash(id));
  float grid = smoothstep(0.48, 0.44, max(abs(f.x), abs(f.y))) * 0.15;
  float mask = smoothstep(0.02, 0.25, r);

  vec3 col = vec3(0.02, 0.025, 0.032);
  vec3 beam = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), hash(id + 2.0));
  col += beam * (streak + grid) * mask * (0.4 + r * 1.4);

  fragColor = vec4(col, 1.0);
}`;

export function WarpSlipstreamTunnelShader({
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
      aria-label="Relativistic polar warp slipstream tunnel shader"
    />
  );
}
