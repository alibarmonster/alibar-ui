"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_thickness;
out vec4 fragColor;

vec3 spectral(float x) {
  return 0.5 + 0.5 * cos(6.28318 * (x + vec3(0.0, 0.33, 0.67)));
}

float waveField(vec2 p, float t) {
  float v = sin(p.x * 3.1 + t) + cos(p.y * 2.7 - t * 0.8);
  v += sin((p.x + p.y) * 2.4 + t * 0.6) * 0.7;
  v += cos(length(p * 2.5) - t * 1.1) * 0.5;
  return v * 0.25 + 0.5;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  float d = length(uv - m);
  vec2 warped = uv + (uv - m) * exp(-d * 3.5) * 0.35;

  float film = waveField(warped * 1.8, u_time * 0.75);
  float opticalPath = film * u_thickness + d * 0.45 + u_time * 0.08;

  vec3 irid = spectral(opticalPath);
  float crest = pow(smoothstep(0.2, 0.9, film), 2.2);

  vec3 base = vec3(0.04, 0.042, 0.05);
  vec3 col = mix(base, irid * vec3(0.75, 0.98, 0.88), crest * 0.78);
  col += pow(max(0.0, 1.0 - d * 1.8), 3.0) * vec3(0.78, 1.0, 0.3) * 0.22;

  fragColor = vec4(col, 1.0);
}`;

export interface ThinFilmShaderProps {
  speed?: number;
  thickness?: number;
  className?: string;
}

export function ThinFilmShader({
  speed = 1,
  thickness = 2.4,
  className,
}: ThinFilmShaderProps) {
  const canvasRef = useGLSL({
    fragmentShader: FRAGMENT_SHADER,
    speed,
    uniforms: { u_thickness: thickness },
  });

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full block cursor-crosshair", className)}
      aria-label="Thin-film optical interference soap-bubble shader"
    />
  );
}
