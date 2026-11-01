"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hexToVec3 } from "@/lib/color";
import { GLSL_NOISE } from "@/lib/webgl/noise.glsl";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export interface LightRaysProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content rendered above the rays. */
  children?: ReactNode;
  /** Ray color; rays are drawn over a transparent background. @default "#F59E0B" */
  color?: string;
  /** Ray strength from 0 to 1. @default 0.55 */
  intensity?: number;
  /** How much the light source sways, from 0 (still) to 2. @default 1 */
  sway?: number;
  /** Animation speed multiplier. @default 1 */
  speed?: number;
  /** Freeze on the current frame. @default false */
  paused?: boolean;
}

const FRAGMENT = /* glsl */ `${GLSL_NOISE}
uniform vec3 u_ray; uniform float u_intensity; uniform float u_sway;
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 origin = vec2(0.5 + 0.06 * sin(u_time * 0.25) * u_sway, 1.3);
  vec2 d = (uv - origin) * vec2(aspect, 1.0);
  float ang = atan(d.x, -d.y);
  float t = u_time;
  float rays = smoothstep(0.35, 1.0, sin(ang * 13.0 + t * 0.25 + sin(t * 0.17) * 1.5 * u_sway) * 0.5 + 0.5) * 0.55;
  rays += smoothstep(0.45, 1.0, sin(ang * 21.0 - t * 0.18 + 1.7) * 0.5 + 0.5) * 0.35;
  rays *= 0.6 + 0.5 * fbm(vec2(ang * 5.0, t * 0.06), 3);
  float fall = smoothstep(1.7, 0.25, length(d)) * smoothstep(-0.1, 0.75, uv.y);
  float a = clamp(rays * fall * u_intensity, 0.0, 1.0);
  fragColor = vec4(u_ray * a, a);
}`;

export function LightRays({
  children,
  color = "#F59E0B",
  intensity = 0.55,
  sway = 1,
  speed = 1,
  paused = false,
  className,
  style,
  ...props
}: LightRaysProps) {
  const { ref } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: FRAGMENT,
    renderScale: 0.6,
    speed,
    paused,
    uniforms: { u_ray: hexToVec3(color), u_intensity: intensity, u_sway: sway },
  });
  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background: `radial-gradient(120% 70% at 50% -10%, color-mix(in oklab, ${color} 22%, transparent), transparent 70%)`, ...style }}
      {...props}
    >
      <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
