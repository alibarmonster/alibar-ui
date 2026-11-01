"use client";

import { useEffect, useRef, type ComponentProps, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hexToVec3 } from "@/lib/color";
import { GLSL_NOISE } from "@/lib/webgl/noise.glsl";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export interface LiquidRippleProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content rendered above the surface. */
  children?: ReactNode;
  /** Water tint. @default "#BFDBFE" */
  color?: string;
  /** Surface base color. @default "#F8FAFF" */
  backgroundColor?: string;
  /** Ripple strength multiplier. @default 1 */
  strength?: number;
  /** Pointer movement and clicks create ripples. @default true */
  interactive?: boolean;
  /** Occasional ripples on their own, so the surface feels alive. @default true */
  autoRipple?: boolean;
  /** Animation speed multiplier. @default 1 */
  speed?: number;
  /** Freeze on the current frame. @default false */
  paused?: boolean;
}

const MAX_RIPPLES = 8;

const FRAGMENT = /* glsl */ `${GLSL_NOISE}
uniform vec4 u_ripples[8]; uniform vec3 u_tint; uniform vec3 u_bg;
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  float h = 0.0; vec2 grad = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    vec4 r = u_ripples[i];
    float age = u_time - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 5.0) continue;
    vec2 d = (uv - r.xy) * vec2(aspect, 1.0);
    float dist = length(d);
    float front = age * 0.32;
    float ring = exp(-pow((dist - front) * 9.0, 2.0));
    float wave = sin((dist - front) * 46.0) * ring * exp(-age * 0.9) * r.w;
    h += wave;
    grad += (d / max(dist, 1e-4)) * wave;
  }
  vec2 suv = uv + grad * 0.012;
  float caustic = fbm(suv * vec2(aspect, 1.0) * 3.2 + u_time * 0.04, 4) * 0.5 + 0.5;
  vec3 col = mix(u_bg, u_tint, 0.18 + 0.42 * smoothstep(0.35, 0.85, caustic));
  col += clamp(h, 0.0, 1.0) * 0.28;
  col -= clamp(-h, 0.0, 1.0) * 0.12 * (1.0 - u_tint);
  fragColor = vec4(col, 1.0);
}`;

// Deterministic positions for automatic ripples.
const AUTO = [
  [0.28, 0.62],
  [0.72, 0.38],
  [0.5, 0.72],
  [0.18, 0.3],
  [0.82, 0.7],
  [0.42, 0.42],
];

export function LiquidRipple({
  children,
  color = "#BFDBFE",
  backgroundColor = "#F8FAFF",
  strength = 1,
  interactive = true,
  autoRipple = true,
  speed = 1,
  paused = false,
  className,
  style,
  ...props
}: LiquidRippleProps) {
  // Ripples live in a ring buffer the shader reads every frame: x, y, start time, strength.
  const ripples = useRef(new Float32Array(MAX_RIPPLES * 4));
  const next = useRef(0);
  const lastMove = useRef({ t: 0, x: -1, y: -1 });
  const tint = hexToVec3(color);
  const background = hexToVec3(backgroundColor);
  const { ref, time } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: FRAGMENT,
    renderScale: 0.7,
    speed,
    paused,
    uniforms: () => ({ u_ripples: ripples.current, u_tint: tint, u_bg: background }),
  });

  const add = (x: number, y: number, power: number) => {
    const slot = (next.current % MAX_RIPPLES) * 4;
    ripples.current.set([x, y, time.current, power * strength], slot);
    next.current += 1;
  };

  useEffect(() => {
    if (!autoRipple || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    const timer = window.setInterval(() => {
      const [x, y] = AUTO[i++ % AUTO.length];
      add(x, y, 0.7);
    }, 2600);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- add only reads refs
  }, [autoRipple, paused]);

  const point = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height] as const;
  };

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background: `radial-gradient(120% 90% at 50% 40%, color-mix(in oklab, ${color} 45%, ${backgroundColor}), ${backgroundColor})`, ...style }}
      onPointerMove={(event) => {
        if (!interactive) return;
        const [x, y] = point(event);
        const now = performance.now();
        const moved = Math.hypot(x - lastMove.current.x, y - lastMove.current.y);
        if (now - lastMove.current.t < 140 || moved < 0.03) return;
        lastMove.current = { t: now, x, y };
        add(x, y, 0.35);
      }}
      onPointerDown={(event) => {
        if (!interactive) return;
        const [x, y] = point(event);
        add(x, y, 1);
      }}
      {...props}
    >
      <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
