"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hexToVec3 } from "@/lib/color";
import { GLSL_NOISE } from "@/lib/webgl/noise.glsl";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export interface GrainGradientProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content rendered above the gradient. */
  children?: ReactNode;
  /** Three gradient colors: left, right and top. @default ["#FFE4E6", "#E0E7FF", "#CFFAFE"] */
  colors?: [string, string, string];
  /** Film grain amount from 0 to 1. @default 0.15 */
  grain?: number;
  /** Drift speed multiplier. @default 1 */
  speed?: number;
  /** Freeze on the current frame. @default false */
  paused?: boolean;
}

const FRAGMENT = /* glsl */ `${GLSL_NOISE}
uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3; uniform float u_grain;
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time * 0.05;
  float n = fbm(uv * 1.3 + vec2(t, -t * 0.7), 3);
  vec3 col = mix(u_c1, u_c2, smoothstep(0.0, 1.0, uv.x + n * 0.35));
  col = mix(col, u_c3, smoothstep(0.25, 1.05, uv.y + n * 0.3));
  float g = hash12(gl_FragCoord.xy + floor(u_time * 24.0) * vec2(17.0, 31.0)) - 0.5;
  col += g * u_grain * 0.32;
  fragColor = vec4(col, 1.0);
}`;

export function GrainGradient({
  children,
  colors = ["#FFE4E6", "#E0E7FF", "#CFFAFE"],
  grain = 0.15,
  speed = 1,
  paused = false,
  className,
  style,
  ...props
}: GrainGradientProps) {
  const [c1, c2, c3] = colors;
  const { ref } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: FRAGMENT,
    speed,
    paused,
    uniforms: { u_c1: hexToVec3(c1), u_c2: hexToVec3(c2), u_c3: hexToVec3(c3), u_grain: Math.min(1, Math.max(0, grain)) },
  });
  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background: `linear-gradient(to top right, ${c1}, ${c2} 55%, ${c3})`, ...style }}
      {...props}
    >
      <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
