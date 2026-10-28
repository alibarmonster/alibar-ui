"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  vec2 p = uv * 5.5;
  vec2 n = floor(p);
  vec2 f = fract(p);

  float md = 8.0;
  float md2 = 8.0;

  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.5 + 0.42 * sin(u_time * 1.2 + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < md) {
        md2 = md;
        md = d;
      } else if (d < md2) {
        md2 = d;
      }
    }
  }

  float edge = md2 - md;
  float membrane = 1.0 - smoothstep(0.0, 0.07, edge);
  float core = exp(-md * 6.5);
  float cursor = exp(-length(uv - m) * 3.5);

  vec3 col = vec3(0.035, 0.04, 0.048);
  col += vec3(0.37, 0.92, 0.83) * core * (0.35 + cursor * 0.5);
  col += mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), cursor) * membrane * 0.9;

  fragColor = vec4(col, 1.0);
}`;

export function VoronoiBioCellShader({
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
      aria-label="Voronoi cellular mitosis membrane shader"
    />
  );
}
