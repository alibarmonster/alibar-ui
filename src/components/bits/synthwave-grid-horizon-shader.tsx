"use client";

import { useGLSL } from "@/hooks/use-glsl";
import { cn } from "@/lib/utils";

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 m = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  vec3 col = vec3(0.025, 0.03, 0.038);

  for (float i = -6.0; i <= 6.0; i++) {
    float rowY = i * 0.07;
    float freq = 3.0 + abs(i) * 0.4;
    float env = exp(-pow((uv.x - m.x * 0.4) * 3.2, 2.0));
    float elev = sin(uv.x * freq * 3.0 + u_time * 2.5 + i * 1.2) * 0.06 * env;
    elev += cos(uv.x * 14.0 - u_time * 3.5 + i) * 0.015;

    float d = uv.y - (rowY + elev);
    if (d < 0.0) {
      col *= 0.25;
    }
    float line = smoothstep(0.008, 0.0, abs(d));
    vec3 tint = mix(vec3(0.37, 0.92, 0.83), vec3(0.78, 1.0, 0.3), (i + 6.0) / 12.0);
    col += tint * line * 0.9;
  }

  fragColor = vec4(col, 1.0);
}`;

export function SynthwaveGridHorizonShader({
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
      aria-label="Pulsar radio elevation scanline horizon shader"
    />
  );
}
