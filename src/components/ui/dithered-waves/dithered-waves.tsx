"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hexToVec3 } from "@/lib/color";
import { GLSL_BAYER, GLSL_NOISE } from "@/lib/webgl/noise.glsl";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export interface DitheredWavesProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content rendered above the waves. */
  children?: ReactNode;
  /** Size of one dither pixel in CSS pixels, 2–8. @default 3 */
  pixelSize?: number;
  /** Ink color. @default "#09090B" */
  color?: string;
  /** Paper color. @default "#FFFFFF" */
  backgroundColor?: string;
  /** Wave density from 0 to 1.5. @default 1 */
  intensity?: number;
  /** Wave speed multiplier. @default 1 */
  speed?: number;
  /** Freeze on the current frame. @default false */
  paused?: boolean;
}

const FRAGMENT = /* glsl */ `${GLSL_NOISE}${GLSL_BAYER}
uniform float u_pixel; uniform vec3 u_ink; uniform vec3 u_paper; uniform float u_intensity;
void main() {
  vec2 cell = floor(gl_FragCoord.xy / u_pixel);
  vec2 uv = cell * u_pixel / u_resolution;
  vec2 p = vec2(uv.x * u_resolution.x / u_resolution.y, uv.y);
  float t = u_time * 0.5;
  float w = sin(p.y * 9.0 + sin(p.x * 2.6 + t) * 1.6 + fbm(p * 1.5 + t * 0.2, 3) * 2.0 - t * 0.6) * 0.5 + 0.5;
  float v = w * smoothstep(1.05, 0.0, uv.y) * u_intensity;
  float ink = step(bayer8(cell) + 0.001, v);
  fragColor = vec4(mix(u_paper, u_ink, ink), 1.0);
}`;

export function DitheredWaves({
  children,
  pixelSize = 3,
  color = "#09090B",
  backgroundColor = "#FFFFFF",
  intensity = 1,
  speed = 1,
  paused = false,
  className,
  style,
  ...props
}: DitheredWavesProps) {
  // One canvas pixel per CSS pixel keeps the dither grid crisp and pixelSize exact.
  const { ref } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: FRAGMENT,
    maxDpr: 1,
    speed,
    paused,
    uniforms: {
      u_pixel: Math.min(8, Math.max(2, Math.round(pixelSize))),
      u_ink: hexToVec3(color),
      u_paper: hexToVec3(backgroundColor),
      u_intensity: intensity,
    },
  });
  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{
        background: `radial-gradient(color-mix(in oklab, ${color} 35%, transparent) 1px, transparent 1.5px) 0 0 / ${pixelSize * 2}px ${pixelSize * 2}px, linear-gradient(to top, color-mix(in oklab, ${color} 18%, ${backgroundColor}), ${backgroundColor} 70%)`,
        ...style,
      }}
      {...props}
    >
      <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10 [&>canvas]:[image-rendering:pixelated]" />
      {children}
    </div>
  );
}
