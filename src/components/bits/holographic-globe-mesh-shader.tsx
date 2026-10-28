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

  vec3 ro = vec3(0.0, 0.0, -2.4);
  vec3 rd = normalize(vec3(uv, 1.4));

  float b = dot(ro, rd);
  float c = dot(ro, ro) - 0.55;
  float h = b * b - c;

  vec3 col = vec3(0.03, 0.035, 0.042);
  float atmo = exp(-max(0.0, length(uv) - 0.36) * 14.0);
  col += vec3(0.37, 0.92, 0.83) * atmo * 0.35;

  if (h > 0.0) {
    float t = -b - sqrt(h);
    vec3 pos = ro + t * rd;
    vec3 nor = normalize(pos);

    float rot = u_time * 0.45 + m.x * 3.14;
    float s = sin(rot), co = cos(rot);
    vec3 q = vec3(co * nor.x + s * nor.z, nor.y, -s * nor.x + co * nor.z);

    float lat = asin(q.y);
    float lon = atan(q.z, q.x);
    vec2 grid = vec2(lon, lat) * 18.0;
    vec2 gid = floor(grid);
    float dotMask = smoothstep(0.38, 0.15, length(fract(grid) - 0.5));
    float land = step(0.42, hash(gid));

    float fresnel = pow(1.0 - max(0.0, dot(-rd, nor)), 2.5);
    col = vec3(0.04, 0.06, 0.07) + vec3(0.78, 1.0, 0.3) * dotMask * land * 0.9;
    col += vec3(0.37, 0.92, 0.83) * fresnel * 0.65;
  }

  fragColor = vec4(col, 1.0);
}`;

export function HolographicGlobeMeshShader({
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
      aria-label="Analytic ray-sphere holographic dotted globe shader"
    />
  );
}
