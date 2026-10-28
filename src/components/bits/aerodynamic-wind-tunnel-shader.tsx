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
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  vec3 col = vec3(0.025, 0.03, 0.038);

  for (float i = 1.0; i <= 7.0; i++) {
    float y0 = (i - 4.0) * 0.09;
    float dMouse = exp(-length(vec2(uv.x, y0) - m) * 4.5);
    float displace = (m.y - y0) * dMouse * 0.45;
    float flow = noise(vec2(uv.x * 3.0 - u_time * (1.5 + i * 0.2), i * 3.0)) * 0.08;

    float d = abs(uv.y - (y0 + displace + flow));
    float line = smoothstep(0.012, 0.0, d);
    float glow = 0.003 / (d + 0.002);

    vec3 tint = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), i / 7.0);
    col += tint * (line * 0.6 + glow * 0.35);
  }

  fragColor = vec4(col, 1.0);
}`;

export function AerodynamicWindTunnelShader({
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
      aria-label="Laminar and turbulent aerodynamic wind tunnel streamlines shader"
    />
  );
}
