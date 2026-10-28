"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

mat2 rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  vec2 p = uv - m * 0.35;
  float r = length(p);
  float a = atan(p.y, p.x);

  float hole = smoothstep(0.11, 0.14, r);
  float photonRing = exp(-abs(r - 0.15) * 45.0) * 1.8;

  vec2 disk = p * mat2(1.0, 0.0, 0.0, 2.8);
  disk *= rot(u_time * 0.6 - 1.2 / (r + 0.08));
  float dr = length(disk);

  float spiral = sin(atan(disk.y, disk.x) * 3.0 - dr * 18.0 + u_time * 2.5) * 0.5 + 0.5;
  float accretion = exp(-abs(dr - 0.28) * 9.0) * (0.6 + 0.4 * spiral);
  float doppler = smoothstep(-0.4, 0.5, p.x);

  vec3 col = vec3(0.02, 0.025, 0.03);
  vec3 hot = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), doppler);
  col += hot * (accretion * (0.7 + 0.6 * doppler) + photonRing);
  col *= hole;

  fragColor = vec4(1.0 - exp(-col * 1.5), 1.0);
}`;

export function EventHorizonShader({
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
      aria-label="Relativistic event horizon accretion shader"
    />
  );
}
