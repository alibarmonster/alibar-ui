"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_distortion;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  float dist = length(uv - m);
  float magnet = exp(-dist * 4.5) * u_distortion;

  vec2 q = vec2(
    fbm(uv * 2.5 + u_time * 0.25),
    fbm(uv * 2.5 - u_time * 0.2 + 4.2)
  );

  vec2 r = vec2(
    fbm(uv * 3.0 + q * 2.2 + (uv - m) * magnet + u_time * 0.3),
    fbm(uv * 3.0 + q * 2.2 - (uv - m) * magnet - u_time * 0.25)
  );

  float f = fbm(uv * 2.5 + r * (1.8 + magnet));

  vec3 normal = normalize(vec3(dFdx(f) * 38.0, dFdy(f) * 38.0, 1.0));
  vec3 lightDir = normalize(vec3(m.x - uv.x, m.y - uv.y, 0.65));
  float diff = max(dot(normal, lightDir), 0.0);
  float spec = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0), 28.0);
  float fresnel = pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);

  vec3 base = mix(vec3(0.03, 0.04, 0.05), vec3(0.11, 0.14, 0.16), f);
  vec3 irid = vec3(0.78, 1.0, 0.3) * spec * 0.9 + vec3(0.37, 0.92, 0.83) * fresnel * 0.55;
  vec3 col = base + diff * 0.18 + irid;

  fragColor = vec4(col, 1.0);
}`;

export interface FerrofluidShaderProps {
  speed?: number;
  distortion?: number;
  className?: string;
}

export function FerrofluidShader({
  speed = 1,
  distortion = 1.6,
  className,
}: FerrofluidShaderProps) {
  const canvasRef = useGLSL({
    fragmentShader: FRAGMENT_SHADER,
    speed,
    uniforms: { u_distortion: distortion },
  });

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full block cursor-crosshair", className)}
      aria-label="Interactive WebGL Ferrofluid surface"
    />
  );
}
