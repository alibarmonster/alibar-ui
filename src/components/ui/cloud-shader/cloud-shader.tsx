"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hexToVec3 } from "@/lib/color";
import { GLSL_NOISE } from "@/lib/webgl/noise.glsl";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export type CloudQuality = "low" | "medium" | "high";

export interface CloudShaderProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content rendered above the sky. */
  children?: ReactNode;
  /** Drift speed multiplier. @default 1 */
  speed?: number;
  /** Cloud cover from 1 (a few wisps) to 6 (overcast). @default 4 */
  density?: number;
  /** Cloud color. @default "#FFFFFF" */
  cloudColor?: string;
  /** Sky color at the top. @default "#CFE3F7" */
  skyTopColor?: string;
  /** Sky color at the bottom. @default "#F7FBFF" */
  skyBottomColor?: string;
  /** Fade the bottom edge into the page background. @default true */
  fadeToBackground?: boolean;
  /** Clouds drift subtly toward the cursor. @default false */
  interactive?: boolean;
  /** Noise detail and render resolution. @default "medium" */
  quality?: CloudQuality;
  /** Freeze the sky on the current frame. @default false */
  paused?: boolean;
}

const QUALITY: Record<CloudQuality, { octaves: number; scale: number }> = {
  low: { octaves: 3, scale: 0.5 },
  medium: { octaves: 5, scale: 0.6 },
  high: { octaves: 6, scale: 0.8 },
};

const fragment = (octaves: number) => /* glsl */ `
${GLSL_NOISE}
uniform vec3 u_sky_top;
uniform vec3 u_sky_bottom;
uniform vec3 u_cloud;
uniform float u_density;
uniform float u_fade;
uniform float u_interactive;

// One cloud layer: a broad shape field (where clouds form) plus fBm detail (their puffy edges).
float clouds(vec2 p, float t, float scale, float drift, float coverage) {
  vec2 q = p * scale + vec2(t * drift, 0.0);
  q += 0.18 * vec2(fbm(q * 0.6 + t * 0.01, 2), fbm(q * 0.6 + 5.3, 2));
  float shape = fbm(q * 0.5 + vec2(3.0, 9.0), 2);
  float detail = fbm(q * 1.6, ${octaves});
  float n = (shape * 0.8 + detail * 0.35) * 0.5 + 0.5;
  float c = smoothstep(coverage, coverage + 0.22, n);
  return c * c * (3.0 - 2.0 * c);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = vec2(uv.x * u_resolution.x / u_resolution.y, uv.y);
  p += (u_mouse - 0.5) * 0.12 * u_pointer * u_interactive;
  float t = u_time;

  vec3 sky = mix(u_sky_bottom, u_sky_top, smoothstep(0.0, 1.0, uv.y));
  float coverage = mix(0.62, 0.34, clamp((u_density - 1.0) / 5.0, 0.0, 1.0));

  // Far layer: smaller, slower, hazier. Near layer: bigger and faster (parallax).
  float far = clouds(p + vec2(3.1, 0.2), t, 2.0, 0.010, coverage + 0.05);
  float near = clouds(p, t, 1.0, 0.026, coverage);
  // Lighting: compare with a sample slightly above, so undersides shade darker and interiors stay bright.
  float above = clouds(p + vec2(0.0, 0.04), t, 1.0, 0.026, coverage);
  float light = clamp(0.96 + (near - above) * 3.2, 0.0, 1.0);

  vec3 shadow = mix(u_cloud, u_sky_top, 0.5) * 0.96;
  vec3 color = mix(sky, mix(u_cloud, u_sky_top, 0.35), far * 0.6);
  color = mix(color, mix(shadow, u_cloud, light), near);

  float alpha = u_fade > 0.5 ? smoothstep(0.0, 0.34, uv.y) : 1.0;
  fragColor = vec4(color * alpha, alpha);
}
`;

const SHADERS = { low: fragment(QUALITY.low.octaves), medium: fragment(QUALITY.medium.octaves), high: fragment(QUALITY.high.octaves) };

export function CloudShader({
  children,
  speed = 1,
  density = 4,
  cloudColor = "#FFFFFF",
  skyTopColor = "#CFE3F7",
  skyBottomColor = "#F7FBFF",
  fadeToBackground = true,
  interactive = false,
  quality = "medium",
  paused = false,
  className,
  style,
  ...props
}: CloudShaderProps) {
  const { ref } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: SHADERS[quality],
    renderScale: QUALITY[quality].scale,
    speed,
    paused,
    pointer: interactive,
    staticTime: 40,
    uniforms: {
      u_sky_top: hexToVec3(skyTopColor),
      u_sky_bottom: hexToVec3(skyBottomColor),
      u_cloud: hexToVec3(cloudColor),
      u_density: density,
      u_fade: fadeToBackground ? 1 : 0,
      u_interactive: interactive ? 1 : 0,
    },
  });

  // Fallback (and first paint): the same sky as a CSS gradient, with the same fade.
  const fallback = fadeToBackground
    ? `linear-gradient(to bottom, ${skyTopColor}, ${skyBottomColor} 66%, color-mix(in oklab, ${skyBottomColor} 0%, transparent))`
    : `linear-gradient(to bottom, ${skyTopColor}, ${skyBottomColor})`;

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={{ background: fallback, ...style }} {...props}>
      <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
