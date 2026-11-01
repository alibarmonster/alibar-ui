"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hexToVec3 } from "@/lib/color";
import { GLSL_NOISE } from "@/lib/webgl/noise.glsl";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export interface GpuAuroraProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content rendered above the aurora. */
  children?: ReactNode;
  /** Three curtain colors. @default ["#A5F3FC", "#C4B5FD", "#FBCFE8"] */
  colors?: [string, string, string];
  /** Curtain strength from 0 to 1.5. @default 0.9 */
  intensity?: number;
  /** Drift speed multiplier. @default 1 */
  speed?: number;
  /** Freeze on the current frame. @default false */
  paused?: boolean;
}

const FRAGMENT = /* glsl */ `${GLSL_NOISE}
uniform vec3 u_a; uniform vec3 u_b; uniform vec3 u_c; uniform float u_intensity;
// One curtain: crisp at its lower edge, rising softly upward, with gentle vertical streaks.
float band(vec2 p, float offset, float t) {
  float y = 0.42 + 0.12 * sin(p.x * 1.6 + t + offset) + 0.1 * fbm(vec2(p.x * 1.1 + t * 0.25, offset), 3);
  float d = p.y - y;
  float shape = d < 0.0 ? exp(-d * d * 60.0) : exp(-d * d * 7.0);
  float streaks = 0.7 + 0.3 * fbm(vec2(p.x * 9.0 - t * 0.3, offset * 3.0 + p.y * 0.6), 3);
  return shape * streaks;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = vec2(uv.x * u_resolution.x / u_resolution.y, uv.y);
  float t = u_time * 0.18;
  float b1 = band(p, 0.0, t);
  float b2 = band(p + vec2(0.45, -0.08), 2.1, t * 0.8);
  float b3 = band(p + vec2(-0.35, 0.1), 4.3, t * 1.15);
  float sum = b1 + b2 + b3;
  vec3 hue = (u_a * b1 + u_b * b2 + u_c * b3) / max(sum, 1e-3);
  float a = clamp(sum * 0.75 * u_intensity, 0.0, 0.92) * smoothstep(1.05, 0.7, uv.y);
  fragColor = vec4(hue * a, a);
}`;

export function GpuAurora({
  children,
  colors = ["#A5F3FC", "#C4B5FD", "#FBCFE8"],
  intensity = 0.9,
  speed = 1,
  paused = false,
  className,
  style,
  ...props
}: GpuAuroraProps) {
  const [a, b, c] = colors;
  const { ref } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: FRAGMENT,
    renderScale: 0.5,
    speed,
    paused,
    uniforms: { u_a: hexToVec3(a), u_b: hexToVec3(b), u_c: hexToVec3(c), u_intensity: intensity },
  });
  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{
        background: `radial-gradient(60% 40% at 30% 55%, color-mix(in oklab, ${a} 70%, transparent), transparent 70%), radial-gradient(55% 40% at 70% 50%, color-mix(in oklab, ${b} 70%, transparent), transparent 70%), radial-gradient(50% 35% at 50% 62%, color-mix(in oklab, ${c} 60%, transparent), transparent 70%)`,
        ...style,
      }}
      {...props}
    >
      <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
