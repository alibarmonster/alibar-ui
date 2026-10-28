"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

float map(vec3 p, vec2 m) {
  vec3 s1 = vec3(sin(u_time * 1.1) * 0.45, cos(u_time * 0.9) * 0.25, 0.0);
  vec3 s2 = vec3(m.x * 0.8, m.y * 0.5, 0.0);
  vec3 s3 = vec3(cos(u_time * 0.7) * -0.4, sin(u_time * 1.3) * -0.25, 0.0);

  float d1 = length(p - s1) - 0.32;
  float d2 = length(p - s2) - 0.28;
  float d3 = length(p - s3) - 0.26;

  float k = 0.35;
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  float m12 = mix(d2, d1, h) - k * h * (1.0 - h);

  h = clamp(0.5 + 0.5 * (d3 - m12) / k, 0.0, 1.0);
  return mix(d3, m12, h) - k * h * (1.0 - h);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  vec3 ro = vec3(0.0, 0.0, 1.8);
  vec3 rd = normalize(vec3(uv, -1.2));

  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < 28; i++) {
    vec3 p = ro + rd * t;
    float d = map(p, m);
    if (d < 0.005) { hit = true; break; }
    if (t > 4.0) break;
    t += d;
  }

  vec3 col = vec3(0.03, 0.035, 0.042);
  if (hit) {
    vec3 p = ro + rd * t;
    vec2 e = vec2(0.005, 0.0);
    vec3 n = normalize(vec3(
      map(p + e.xyy, m) - map(p - e.xyy, m),
      map(p + e.yxy, m) - map(p - e.yxy, m),
      map(p + e.yyx, m) - map(p - e.yyx, m)
    ));
    float diff = max(0.0, dot(n, normalize(vec3(1.0, 1.0, 1.0))));
    float fres = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
    col = vec3(0.08, 0.14, 0.14) + vec3(0.78, 1.0, 0.3) * diff * 0.75 + vec3(0.37, 0.92, 0.83) * fres * 0.85;
  }

  fragColor = vec4(col, 1.0);
}`;

export function LiquidMercuryMetaballsShader({
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
      aria-label="Smooth-minimum SDF raymarched liquid mercury metaballs shader"
    />
  );
}
