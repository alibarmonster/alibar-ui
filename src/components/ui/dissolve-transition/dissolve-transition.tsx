"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, rgb, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas, type HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

export interface DissolveTransitionProps {
  /** Identifies the current content. Changing it dissolves the old content into the new. */
  contentKey: string | number;
  /** The current content. */
  children: ReactNode;
  /** How content breaks up: growing pixel blocks, an ordered dither or a noise field. @default "pixel" */
  mode?: "pixel" | "dither" | "noise";
  /** Seconds the swap takes. @default 0.9 */
  duration?: number;
  /** Where the dissolve starts sweeping from; "none" dissolves everywhere at once. @default "none" */
  direction?: "none" | "up" | "down" | "left" | "right";
  /** Color of the glowing edge in noise mode. @default "#2563eb" */
  edgeColor?: string;
  /** "auto" uses HTML-in-Canvas when available, "fallback" never does. @default "auto" */
  rendering?: HtmlCanvasMode;
  /** Called when the rendering mode is known. */
  onModeChange?: (native: boolean) => void;
  /** Called when a transition finishes. */
  onTransitionEnd?: () => void;
  /** Classes for the root. */
  className?: string;
}

const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform vec2 u_size;
out vec2 v_uv;
${PROJECT_GLSL}
void main() {
  v_uv = a_pos;
  gl_Position = projectCss(vec4(a_pos * u_size, 0.0, 1.0));
}`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_out;
uniform sampler2D u_in;
uniform vec2 u_outSize;
uniform vec2 u_inSize;
uniform vec2 u_size;
uniform float u_p;
uniform int u_mode;
uniform vec2 u_dir;
uniform vec3 u_edge;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float bayer(vec2 p) {
  ivec2 c = ivec2(mod(p, 4.0));
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[c.y * 4 + c.x]) + 0.5) / 16.0;
}
vec4 sampleIn(sampler2D t, vec2 px, vec2 size) {
  vec2 uv = px / size;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture(t, uv);
}

void main() {
  vec2 px = v_uv * u_size;
  // A sweep coordinate (0 at the start edge, 1 at the far edge) biases each cell's threshold.
  float sweep = dot(u_dir, u_dir) > 0.0 ? clamp(dot(v_uv - 0.5, u_dir) + 0.5, 0.0, 1.0) : 0.5;
  float bias = dot(u_dir, u_dir) > 0.0 ? 0.55 : 0.0;
  float p = u_p * (1.0 + bias) - bias * 0.5;

  vec4 o; vec4 n; float tOut; float tIn; float edge = 0.0;
  if (u_mode == 0) {
    // Pixel: outgoing blocks grow and drop out; incoming blocks start coarse and sharpen.
    float bo = 1.0 + floor(u_p * 22.0);
    float bi = 1.0 + floor((1.0 - u_p) * 22.0);
    vec2 co = (floor(px / bo) + 0.5) * bo;
    vec2 ci = (floor(px / bi) + 0.5) * bi;
    o = sampleIn(u_out, co, u_outSize);
    n = sampleIn(u_in, ci, u_inSize);
    float h = hash(floor(px / 12.0));
    tOut = mix(h, sweep, bias);
    tIn = tOut;
  } else if (u_mode == 1) {
    // Dither: an ordered Bayer threshold on 3px cells.
    vec2 cell = floor(px / 3.0);
    o = sampleIn(u_out, (cell + 0.5) * 3.0 * step(0.02, u_p) + px * (1.0 - step(0.02, u_p)), u_outSize);
    n = sampleIn(u_in, mix((cell + 0.5) * 3.0, px, step(0.98, u_p)), u_inSize);
    tOut = mix(bayer(cell), sweep, bias);
    tIn = tOut;
  } else {
    // Noise: a soft value-noise field with a glowing edge.
    float v = vnoise(px / 26.0) * 0.65 + vnoise(px / 7.0) * 0.35;
    tOut = mix(v, sweep, bias);
    tIn = tOut;
    o = sampleIn(u_out, px, u_outSize);
    n = sampleIn(u_in, px, u_inSize);
    edge = 1.0 - smoothstep(0.0, 0.06, abs(tOut - p));
  }
  float keepOut = step(p, tOut);
  float showIn = 1.0 - step(p, tIn);
  vec4 color = o * keepOut + n * showIn * (1.0 - keepOut);
  if (u_mode == 2 && u_p > 0.0 && u_p < 1.0) color.rgb = mix(color.rgb, u_edge, edge * 0.85) ;
  if (u_mode == 2 && u_p > 0.0 && u_p < 1.0) color.a = max(color.a, edge * 0.85);
  outColor = color;
}`;

const MODES = { pixel: 0, dither: 1, noise: 2 } as const;
const DIRS = { none: [0, 0], up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;

type Slot = { key: string | number; node: ReactNode };

/**
 * A wrapper for swapping content (tabs, steps, routes) through HTML-in-Canvas: the outgoing live DOM
 * dissolves into pixel blocks, dither dots or noise while the incoming DOM resolves out of the same
 * pattern. Without the API, or with reduced motion, it crossfades with a blur (a plain fade under
 * reduced motion).
 */
export function DissolveTransition({
  contentKey,
  children,
  mode = "pixel",
  duration = 0.9,
  direction = "none",
  edgeColor = "#2563eb",
  rendering = "auto",
  onModeChange,
  onTransitionEnd,
  className,
}: DissolveTransitionProps) {
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState<Slot>({ key: contentKey, node: children });
  const [outgoing, setOutgoing] = useState<Slot | null>(null);
  // New key: the old content becomes the outgoing slot. Same key: keep the content fresh.
  if (contentKey !== current.key) {
    setOutgoing(current);
    setCurrent({ key: contentKey, node: children });
  } else if (children !== current.node) {
    setCurrent({ key: contentKey, node: children });
  }

  const inRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const transition = useRef({ start: -1, captured: false, frames: 0 });
  const gl = useRef<{ program: Program; mesh: Mesh; tin: ElementTexture; tout: ElementTexture } | null>(null);

  const { native, canvasRef, canvasProps, invalidate } = useHtmlCanvas({
    context: "webgl2",
    mode: rendering,
    animating: outgoing !== null,
    setup: (ctx) => {
      gl.current = { program: createProgram(ctx, VERT, FRAG), mesh: createGrid(ctx), tin: createElementTexture(ctx), tout: createElementTexture(ctx) };
      return () => {
        if (!gl.current) return;
        ctx.deleteProgram(gl.current.program.program);
        ctx.deleteTexture(gl.current.tin.texture);
        ctx.deleteTexture(gl.current.tout.texture);
        gl.current = null;
      };
    },
    render: ({ ctx, canvas, width, height: h, reason, changed }) => {
      const g = gl.current;
      const incoming = inRef.current;
      if (!g || !incoming) return;
      const out = outRef.current;
      if (reason !== "frame" || !g.tin.width) {
        uploadElementTexture(ctx, g.tin, incoming);
        syncElementGeometry(canvas, incoming, new DOMMatrix());
      }
      let p = 1;
      if (out) {
        const tr = transition.current;
        if (!tr.captured) {
          // Capture the outgoing content once the browser has painted it in its new slot; until then
          // draw nothing, so the canvas keeps showing the last frame.
          tr.frames += 1;
          const painted = reason === "paint" && changed.some((el) => el === out || out.contains(el));
          if (!painted && tr.frames < 6) return;
          uploadElementTexture(ctx, g.tout, out);
          uploadElementTexture(ctx, g.tin, incoming);
          transition.current = { start: performance.now(), captured: true, frames: tr.frames };
        }
        p = Math.min(1, (performance.now() - transition.current.start) / 1000 / Math.max(0.1, duration));
        if (p >= 1) window.setTimeout(() => setOutgoing(null), 0);
      }
      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.enable(ctx.BLEND);
      ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
      ctx.useProgram(g.program.program);
      const { u } = g.program;
      ctx.uniform2f(u("u_canvas"), width, h);
      ctx.uniform2f(u("u_size"), width, h);
      ctx.uniform2f(u("u_inSize"), g.tin.width || width, g.tin.height || h);
      ctx.uniform2f(u("u_outSize"), g.tout.width || width, g.tout.height || h);
      ctx.uniform1f(u("u_p"), out ? p : 1);
      ctx.uniform1i(u("u_mode"), MODES[mode]);
      ctx.uniform2f(u("u_dir"), DIRS[direction][0], DIRS[direction][1]);
      ctx.uniform3f(u("u_edge"), ...rgb(edgeColor));
      ctx.activeTexture(ctx.TEXTURE0);
      ctx.bindTexture(ctx.TEXTURE_2D, g.tout.texture);
      ctx.uniform1i(u("u_out"), 0);
      ctx.activeTexture(ctx.TEXTURE1);
      ctx.bindTexture(ctx.TEXTURE_2D, g.tin.texture);
      ctx.uniform1i(u("u_in"), 1);
      drawMesh(ctx, g.mesh);
    },
  });

  useEffect(() => onModeChange?.(native), [native, onModeChange]);

  // A new outgoing slot starts a new transition; finishing one reports it.
  useLayoutEffect(() => {
    transition.current = { start: -1, captured: false, frames: 0 };
    if (outgoing) invalidate();
  }, [outgoing, invalidate]);
  const hadOutgoing = useRef(false);
  useEffect(() => {
    if (hadOutgoing.current && !outgoing) onTransitionEnd?.();
    hadOutgoing.current = outgoing !== null;
  }, [outgoing, onTransitionEnd]);

  // In native mode the canvas is as tall as the taller of the two contents.
  useEffect(() => {
    if (!native) return;
    const measure = () => setHeight(Math.max(inRef.current?.offsetHeight ?? 0, outRef.current?.offsetHeight ?? 0));
    const observer = new ResizeObserver(measure);
    if (inRef.current) observer.observe(inRef.current);
    if (outRef.current) observer.observe(outRef.current);
    measure();
    return () => observer.disconnect();
  }, [native, outgoing, current.key]);

  if (!native) {
    return (
      <div className={cn("grid w-full [&>*]:[grid-area:1/1]", className)}>
        <AnimatePresence initial={false}>
          <motion.div
            key={current.key}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: reduceMotion ? 0.2 : duration * 0.7, ease: ease.out }}
            onAnimationComplete={() => onTransitionEnd?.()}
          >
            {current.node}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)} style={{ height: height ?? undefined }}>
      <canvas ref={canvasRef} {...canvasProps} className="absolute inset-0 block size-full">
        <div ref={inRef} key={`in-${current.key}`} className="w-full">
          {current.node}
        </div>
        {outgoing ? (
          <div ref={outRef} key={`out-${outgoing.key}`} className="pointer-events-none w-full" aria-hidden="true" inert>
            {outgoing.node}
          </div>
        ) : null}
      </canvas>
    </div>
  );
}
