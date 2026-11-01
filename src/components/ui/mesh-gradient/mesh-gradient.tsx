"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hexToVec3 } from "@/lib/color";
import { GLSL_NOISE } from "@/lib/webgl/noise.glsl";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export interface MeshGradientProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content rendered above the gradient. */
  children?: ReactNode;
  /** Four mesh colors. @default ["#C7D2FE", "#FBCFE8", "#BAE6FD", "#FDE68A"] */
  colors?: [string, string, string, string];
  /** Flow speed multiplier. @default 1 */
  speed?: number;
  /** Freeze on the current frame. @default false */
  paused?: boolean;
}

const FRAGMENT = /* glsl */ `${GLSL_NOISE}
uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3; uniform vec3 u_c4;
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  float t = u_time * 0.12;
  vec2 p = uv + 0.1 * vec2(snoise(uv * 1.4 + t), snoise(uv * 1.4 + vec2(4.0, 2.0) - t));
  p.x *= aspect;
  vec2 a = vec2((0.2 + 0.18 * sin(t * 1.3)) * aspect, 0.25 + 0.2 * cos(t * 1.1));
  vec2 b = vec2((0.82 + 0.12 * cos(t * 0.9)) * aspect, 0.3 + 0.2 * sin(t * 1.7));
  vec2 c = vec2((0.25 + 0.2 * cos(t * 1.5)) * aspect, 0.8 + 0.12 * sin(t * 0.8));
  vec2 d = vec2((0.78 + 0.15 * sin(t * 1.2)) * aspect, 0.76 + 0.15 * cos(t * 1.4));
  float wa = 1.0 / (0.03 + pow(distance(p, a), 2.2));
  float wb = 1.0 / (0.03 + pow(distance(p, b), 2.2));
  float wc = 1.0 / (0.03 + pow(distance(p, c), 2.2));
  float wd = 1.0 / (0.03 + pow(distance(p, d), 2.2));
  vec3 col = (u_c1 * wa + u_c2 * wb + u_c3 * wc + u_c4 * wd) / (wa + wb + wc + wd);
  fragColor = vec4(col, 1.0);
}`;

export function MeshGradient({
  children,
  colors = ["#C7D2FE", "#FBCFE8", "#BAE6FD", "#FDE68A"],
  speed = 1,
  paused = false,
  className,
  style,
  ...props
}: MeshGradientProps) {
  const [c1, c2, c3, c4] = colors;
  const { ref } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: FRAGMENT,
    renderScale: 0.5,
    speed,
    paused,
    uniforms: { u_c1: hexToVec3(c1), u_c2: hexToVec3(c2), u_c3: hexToVec3(c3), u_c4: hexToVec3(c4) },
  });
  const fallback = `radial-gradient(at 20% 25%, ${c1}, transparent 55%), radial-gradient(at 80% 30%, ${c2}, transparent 55%), radial-gradient(at 25% 80%, ${c3}, transparent 55%), radial-gradient(at 78% 76%, ${c4}, transparent 55%), ${c1}`;
  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={{ background: fallback, ...style }} {...props}>
      <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
