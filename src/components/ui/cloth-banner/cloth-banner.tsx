"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas, type HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

export interface ClothBannerProps {
  /** The announcement: text and links. */
  children: ReactNode;
  /** Colors of the bar. @default "dark" */
  variant?: "dark" | "brand" | "light";
  /** Show a close button. @default true */
  dismissible?: boolean;
  /** Called when the close button is pressed. */
  onDismiss?: () => void;
  /** Wind strength, 0–2. @default 1 */
  wind?: number;
  /** "auto" uses HTML-in-Canvas when available, "fallback" never does. @default "auto" */
  rendering?: HtmlCanvasMode;
  /** Called when the rendering mode is known. */
  onModeChange?: (native: boolean) => void;
  /** Classes for the root. */
  className?: string;
}

/** Room around the bar for the cloth to billow into, in px. */
const PAD = 14;

const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform vec2 u_size;
uniform vec2 u_offset;
uniform float u_time;
uniform float u_amp;
uniform float u_gust;
out vec2 v_uv;
out float v_shade;
${PROJECT_GLSL}

float wave(vec2 p) {
  // Pinned at the left edge; travelling waves grow toward the free end.
  float pin = smoothstep(0.0, 0.55, p.x);
  float w = sin(p.x * 9.0 - u_time * 2.6 + p.y * 1.4) * 0.6 + sin(p.x * 17.0 - u_time * 4.1 + p.y * 3.0) * 0.25;
  return w * pin * (u_amp + u_gust);
}

void main() {
  vec2 p = a_pos;
  float z = wave(p) * 14.0;
  // The cloth also ripples slightly up and down, more at the free end.
  float dy = cos(p.x * 9.0 - u_time * 2.6) * 2.2 * smoothstep(0.0, 0.6, p.x) * (u_amp + u_gust);
  vec2 css = u_offset + p * u_size + vec2(0.0, dy);
  // Shade from the slope along x: folds facing the light brighten, the others darken.
  float eps = 0.01;
  float slope = (wave(p + vec2(eps, 0.0)) - wave(p - vec2(eps, 0.0))) / (2.0 * eps);
  v_shade = clamp(slope * 0.045, -0.22, 0.22);
  v_uv = a_pos;
  // Simple perspective around the canvas center: nearer folds grow a little.
  vec2 center = u_canvas * 0.5;
  float s = 600.0 / (600.0 - z);
  gl_Position = projectCss(vec4(center + (css - center) * s, 0.0, 1.0));
}`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
in float v_shade;
uniform sampler2D u_tex;
out vec4 outColor;
void main() {
  vec4 c = texture(u_tex, v_uv);
  c.rgb += c.a * v_shade;
  outColor = c;
}`;

const VARIANTS = {
  dark: "bg-foreground text-background [&_a]:text-background",
  brand: "bg-primary text-white [&_a]:text-white",
  light: "bg-surface-2 text-foreground border border-border [&_a]:text-foreground",
};

/**
 * An announcement bar (real text, link and close button) drawn through HTML-in-Canvas on gently waving
 * cloth, pinned at the left and lit by its folds. Moving the pointer across it gusts the wind;
 * hovering the link or the close button calms it so they are easy to hit. Without the API, the bar
 * sways with a subtle CSS skew (still under reduced motion).
 */
export function ClothBanner({ children, variant = "dark", dismissible = true, onDismiss, wind = 1, rendering = "auto", onModeChange, className }: ClothBannerProps) {
  const reduceMotion = useReducedMotion();
  const barRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [height, setHeight] = useState<number | null>(null);
  const motionState = useRef({ amp: 1, target: 1, gust: 0, lastX: 0, time: 0 });
  const gl = useRef<{ program: Program; mesh: Mesh; texture: ElementTexture } | null>(null);

  const { native, canvasRef, canvasProps } = useHtmlCanvas({
    context: "webgl2",
    mode: rendering,
    animating: open,
    setup: (ctx) => {
      gl.current = { program: createProgram(ctx, VERT, FRAG), mesh: createGrid(ctx, 48, 6), texture: createElementTexture(ctx) };
      return () => {
        if (!gl.current) return;
        ctx.deleteProgram(gl.current.program.program);
        ctx.deleteTexture(gl.current.texture.texture);
        gl.current = null;
      };
    },
    render: ({ ctx, canvas, width, height: h, reason, delta }) => {
      const g = gl.current;
      const bar = barRef.current;
      if (!g || !bar) return;
      if (reason !== "frame" || !g.texture.width) {
        uploadElementTexture(ctx, g.texture, bar);
        // The flat bar is the closest affine shape to the cloth; calm waves keep it close.
        syncElementGeometry(canvas, bar, new DOMMatrix().translate(0, PAD));
      }
      const m = motionState.current;
      m.time += delta;
      m.amp += (m.target * Math.max(0, Math.min(2, wind)) - m.amp) * (1 - Math.exp(-delta * 4));
      m.gust *= Math.exp(-delta * 1.6);
      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.enable(ctx.BLEND);
      ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
      ctx.useProgram(g.program.program);
      const { u } = g.program;
      ctx.uniform2f(u("u_canvas"), width, h);
      ctx.uniform2f(u("u_size"), g.texture.width || width, g.texture.height || h - PAD * 2);
      ctx.uniform2f(u("u_offset"), 0, PAD);
      ctx.uniform1f(u("u_time"), m.time);
      ctx.uniform1f(u("u_amp"), m.amp * 0.5);
      ctx.uniform1f(u("u_gust"), m.gust);
      ctx.activeTexture(ctx.TEXTURE0);
      ctx.bindTexture(ctx.TEXTURE_2D, g.texture.texture);
      ctx.uniform1i(u("u_tex"), 0);
      drawMesh(ctx, g.mesh);
    },
  });

  useEffect(() => onModeChange?.(native), [native, onModeChange]);

  useEffect(() => {
    const el = barRef.current;
    if (!native || !el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight + PAD * 2));
    observer.observe(el);
    return () => observer.disconnect();
  }, [native, open]);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const m = motionState.current;
    const interactive = (event.target as HTMLElement).closest("a, button");
    m.target = interactive ? 0.12 : 1;
    // Fast sideways moves gust the cloth.
    const dx = Math.abs(event.clientX - m.lastX);
    m.lastX = event.clientX;
    if (!interactive) m.gust = Math.min(0.9, m.gust + dx * 0.004);
  };
  const onPointerLeave = () => {
    motionState.current.target = 1;
  };

  const dismiss = () => {
    setOpen(false);
    onDismiss?.();
  };

  const bar = (
    <div
      ref={barRef}
      role="region"
      aria-label="Announcement"
      className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-4", VARIANTS[variant])}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {dismissible ? (
        <button type="button" onClick={dismiss} aria-label="Dismiss announcement" className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full opacity-80 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current">
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="banner"
          exit={{ opacity: 0, transition: { duration: duration.quick, ease: ease.out } }}
          className={cn("w-full max-w-2xl", className)}
          onPointerMove={native ? onPointerMove : undefined}
          onPointerLeave={native ? onPointerLeave : undefined}
        >
          {native ? (
            <div className="relative -my-[14px]" style={{ height: height ?? undefined }}>
              <canvas ref={canvasRef} {...canvasProps} className="absolute inset-0 block size-full">
                {bar}
              </canvas>
            </div>
          ) : (
            <motion.div
              style={{ transformOrigin: "0% 50%" }}
              animate={reduceMotion ? undefined : { skewY: [0, 0.5, 0, -0.5, 0], rotate: [0, 0.15, 0, -0.15, 0] }}
              transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              {bar}
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
