"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hexToVec3 } from "@/lib/color";
import { GLSL_NOISE } from "@/lib/webgl/noise.glsl";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export interface DotMatrixFieldProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content rendered above the dots. */
  children?: ReactNode;
  /** Distance between dot centers in canvas pixels. @default 14 */
  spacing?: number;
  /** Dot color. @default "#09090B" */
  color?: string;
  /** Largest dot radius as a share of the cell, 0.1–0.5. @default 0.38 */
  maxSize?: number;
  /** Overall opacity of the dots. @default 1 */
  opacity?: number;
  /** Dots swell near the cursor. @default true */
  interactive?: boolean;
  /** Field speed multiplier. @default 1 */
  speed?: number;
  /** Freeze on the current frame. @default false */
  paused?: boolean;
}

const FRAGMENT = /* glsl */ `${GLSL_NOISE}
uniform float u_spacing; uniform vec3 u_dot; uniform float u_max; uniform float u_opacity; uniform float u_interactive;
void main() {
  vec2 cell = floor(gl_FragCoord.xy / u_spacing);
  vec2 local = fract(gl_FragCoord.xy / u_spacing) - 0.5;
  vec2 cuv = (cell + 0.5) * u_spacing / u_resolution.y;
  float aspect = u_resolution.x / u_resolution.y;
  float n = fbm(cuv * 2.0 + vec2(u_time * 0.07, u_time * 0.035), 3) * 0.5 + 0.5;
  n += u_pointer * u_interactive * 0.6 * smoothstep(0.3, 0.0, distance(cuv, u_mouse * vec2(aspect, 1.0)));
  float r = mix(0.08, u_max, smoothstep(0.25, 0.8, n));
  float a = smoothstep(r, r - 1.2 * 2.0 / u_spacing, length(local));
  float o = a * mix(0.22, 0.9, smoothstep(0.25, 0.85, n)) * u_opacity;
  fragColor = vec4(u_dot * o, o);
}`;

export function DotMatrixField({
  children,
  spacing = 14,
  color = "#09090B",
  maxSize = 0.38,
  opacity = 1,
  interactive = true,
  speed = 1,
  paused = false,
  className,
  style,
  ...props
}: DotMatrixFieldProps) {
  const { ref } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: FRAGMENT,
    speed,
    paused,
    pointer: interactive,
    uniforms: {
      u_spacing: Math.max(6, spacing),
      u_dot: hexToVec3(color),
      u_max: Math.min(0.5, Math.max(0.1, maxSize)),
      u_opacity: opacity,
      u_interactive: interactive ? 1 : 0,
    },
  });
  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{
        backgroundImage: `radial-gradient(color-mix(in oklab, ${color} 22%, transparent) 1.2px, transparent 1.7px)`,
        backgroundSize: `${spacing}px ${spacing}px`,
        ...style,
      }}
      {...props}
    >
      <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
