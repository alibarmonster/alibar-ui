"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { hexToVec3 } from "@/lib/color";
import { GLSL_NOISE } from "@/lib/webgl/noise.glsl";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

export interface GlowOrbProps extends Omit<ComponentProps<"div">, "children"> {
  /** Assistant state; each one moves at its own pace. @default "idle" */
  state?: OrbState;
  /** Audio level from 0 to 1, e.g. microphone or speech volume. Swells the orb. @default 0 */
  level?: number;
  /** Highlight color at the core. @default "#93C5FD" */
  innerColor?: string;
  /** Body and glow color. @default "#6366F1" */
  outerColor?: string;
  /** Accessible label; announced with the state. @default "Assistant" */
  label?: string;
  /** Freeze on the current frame. @default false */
  paused?: boolean;
}

const FRAGMENT = /* glsl */ `${GLSL_NOISE}
uniform vec3 u_inner; uniform vec3 u_outer; uniform float u_level; uniform float u_activity;
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  float t = u_time * u_activity;
  float r = length(p);
  float R = 0.27 + 0.018 * sin(t * 2.2) + u_level * 0.06;
  float n = fbm(p * 3.0 + vec2(t * 0.3, -t * 0.22), 4);
  float edge = R + n * 0.03;
  float body = smoothstep(edge, edge - 0.012, r);
  float swirl = fbm(p * 3.6 + n * 1.6 + vec2(t * 0.12, t * 0.07), 4) * 0.5 + 0.5;
  vec3 core = mix(u_outer, u_inner, clamp(smoothstep(R, 0.0, r) * 0.7 + swirl * 0.5, 0.0, 1.0));
  core += vec3(1.0) * smoothstep(0.13, 0.0, length(p - vec2(-0.09, 0.1))) * 0.35;
  float glow = exp(-max(r - R * 0.85, 0.0) * 10.0) * (0.45 + u_level * 0.3);
  vec3 col = core * body + u_outer * glow * (1.0 - body);
  float a = clamp(body + glow * (1.0 - body), 0.0, 1.0);
  fragColor = vec4(col, a);
}`;

const ACTIVITY: Record<OrbState, number> = { idle: 0.55, listening: 1, thinking: 1.9, speaking: 1.3 };

export function GlowOrb({
  state = "idle",
  level = 0,
  innerColor = "#93C5FD",
  outerColor = "#6366F1",
  label = "Assistant",
  paused = false,
  className,
  style,
  ...props
}: GlowOrbProps) {
  const { ref } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: FRAGMENT,
    renderScale: 0.75,
    paused,
    staticTime: 3,
    uniforms: {
      u_inner: hexToVec3(innerColor),
      u_outer: hexToVec3(outerColor),
      u_level: Math.min(1, Math.max(0, level)),
      u_activity: ACTIVITY[state],
    },
  });
  return (
    <div
      role="img"
      aria-label={`${label}, ${state}`}
      className={cn("relative isolate aspect-square w-48 overflow-hidden", className)}
      style={{
        background: `radial-gradient(circle at 42% 40%, ${innerColor}, ${outerColor} 26%, color-mix(in oklab, ${outerColor} 25%, transparent) 30%, transparent 46%)`,
        ...style,
      }}
      {...props}
    >
      <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10" />
    </div>
  );
}
