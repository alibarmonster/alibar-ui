"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_density;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  float mousePeak = exp(-length(uv - m) * 4.0) * 0.28;
  float elev = fbm(uv * 2.6 + vec2(u_time * 0.12, -u_time * 0.08)) + mousePeak;

  float scaled = elev * u_density;
  float fractLine = fract(scaled);
  float df = fwidth(scaled);
  float contour = 1.0 - smoothstep(0.0, df * 1.6, min(fractLine, 1.0 - fractLine));

  float major = 1.0 - smoothstep(0.0, df * 2.2, min(fract(scaled * 0.25), 1.0 - fract(scaled * 0.25)));

  vec3 bg = vec3(0.035, 0.038, 0.045);
  vec3 minorCol = vec3(0.22, 0.48, 0.44);
  vec3 majorCol = vec3(0.78, 1.0, 0.3);

  vec3 col = bg + minorCol * contour * 0.55 + majorCol * major * 0.85;
  fragColor = vec4(col, 1.0);
}`;

export interface TopographyShaderProps {
  speed?: number;
  density?: number;
  className?: string;
}

export function TopographyShader({
  speed = 1,
  density = 18,
  className,
}: TopographyShaderProps) {
  const canvasRef = useGLSL({
    fragmentShader: FRAGMENT_SHADER,
    speed,
    uniforms: { u_density: density },
  });

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full block cursor-crosshair", className)}
      aria-label="Procedural elevation isoline topography shader"
    />
  );
}
