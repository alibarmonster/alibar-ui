"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, setMatrix, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { perspective, syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas, type HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

export interface LivingBookProps {
  /** Pages in order, two per spread (left, right). Each is live DOM: text, links, small forms. */
  pages: ReactNode[];
  /** Page size in px. @default { width: 240, height: 320 } */
  pageSize?: { width: number; height: number };
  /** Spread index (controlled). */
  spread?: number;
  /** Starting spread when uncontrolled. @default 0 */
  defaultSpread?: number;
  /** Called when a page turn finishes. */
  onSpreadChange?: (spread: number) => void;
  /** Accessible name for the book. @default "Book" */
  label?: string;
  /** "auto" uses HTML-in-Canvas when available, "fallback" never does. @default "auto" */
  rendering?: HtmlCanvasMode;
  /** Called when the rendering mode is known. */
  onModeChange?: (native: boolean) => void;
  /** Classes for the root. */
  className?: string;
}

const MARGIN = 36;
/** Extra room above the book for a page standing up mid-turn. */
const HEADROOM = 64;
const TILT = 16;
const DISTANCE = 1400;

const PAGE_VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform vec2 u_size;
uniform mat4 u_book;
uniform float u_side;     // -1 left page, 1 right page, 0 turning sheet
uniform float u_progress; // turning: 0 flat right … 1 flat left
uniform float u_dir;      // 1 turning forward, -1 backward
out vec2 v_uv;
out float v_angle;
out float v_spine;
${PROJECT_GLSL}
void main() {
  float u = a_pos.x;
  float pw = u_size.x;
  vec3 p;
  float angle = 0.0;
  if (u_side < -0.5) {
    p = vec3(-pw + u * pw, a_pos.y * u_size.y, 0.0);
    v_spine = 1.0 - u;
    angle = 3.14159265;
  } else if (u_side > 0.5) {
    p = vec3(u * pw, a_pos.y * u_size.y, 0.0);
    v_spine = u;
  } else {
    // The sheet bends as it turns: the outer edge trails behind the spine edge.
    float pi = 3.14159265;
    float a0 = (u_dir > 0.0 ? u_progress : 1.0 - u_progress) * pi;
    float k = -sin(u_progress * pi) * 0.85 * u_dir;
    float a = a0 + k * u;
    float x;
    float z;
    if (abs(k) < 0.001) {
      x = cos(a0) * u * pw;
      z = sin(a0) * u * pw;
    } else {
      x = (sin(a0 + k * u) - sin(a0)) / k * pw;
      z = (cos(a0) - cos(a0 + k * u)) / k * pw;
    }
    p = vec3(x, a_pos.y * u_size.y, z);
    angle = a;
    v_spine = u;
  }
  v_uv = a_pos;
  v_angle = angle;
  gl_Position = projectCss(u_book * vec4(p, 1.0));
}`;

const PAGE_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
in float v_angle;
in float v_spine;
uniform sampler2D u_front;
uniform sampler2D u_back;
uniform float u_side;
out vec4 outColor;
void main() {
  vec4 c;
  if (u_side > -0.5 && u_side < 0.5 && v_angle > 1.5708) {
    // The turning sheet's back is the next left page, mirrored as it faces the other way.
    c = texture(u_back, vec2(1.0 - v_uv.x, v_uv.y));
  } else {
    c = texture(u_front, v_uv);
  }
  // Paper under the page, a shadow along the spine and light from how far the sheet has turned.
  vec3 col = mix(vec3(0.99, 0.98, 0.96), c.rgb, c.a);
  float spine = smoothstep(0.0, 0.18, v_spine);
  col *= 0.78 + 0.22 * spine;
  if (u_side > -0.5 && u_side < 0.5) col *= 0.86 + 0.14 * abs(cos(v_angle));
  outColor = vec4(col, 1.0);
}`;

/**
 * A 3D book drawn through HTML-in-Canvas whose pages are live DOM: selectable text, links, even a small
 * form. Drag a page edge, use the arrow keys or the buttons to turn pages with a curl and a spine
 * shadow. The open spread's geometry is synced so text selection and clicks work on the drawn pages.
 * Without the API, it is a two-column paginated book with a CSS page turn.
 */
export function LivingBook({
  pages,
  pageSize = { width: 240, height: 320 },
  spread: spreadProp,
  defaultSpread = 0,
  onSpreadChange,
  label = "Book",
  rendering = "auto",
  onModeChange,
  className,
}: LivingBookProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const spreads = Math.max(1, Math.ceil(pages.length / 2));
  const [inner, setInner] = useState(defaultSpread);
  const spread = Math.min(spreads - 1, Math.max(0, spreadProp ?? inner));
  const [turn, setTurn] = useState<{ dir: 1 | -1 } | null>(null);
  const turnState = useRef({ progress: 0, target: 1, dragging: false, startX: 0 });
  const pageRefs = useRef(new Map<number, HTMLDivElement>());
  const textures = useRef(new Map<number, ElementTexture>());
  const gl = useRef<{ program: Program; flat: Mesh; sheet: Mesh } | null>(null);
  const { width: pw, height: ph } = pageSize;

  const commit = (next: number) => {
    if (spreadProp === undefined) setInner(next);
    onSpreadChange?.(next);
  };

  // Pages involved in the current view: the open spread plus, while turning, the pages being uncovered.
  const left = spread * 2;
  const right = spread * 2 + 1;
  const involved = turn ? (turn.dir > 0 ? [left, right, right + 1, right + 2] : [left - 2, left - 1, left, right]) : [left, right];

  const { native, canvasRef, canvasProps, invalidate } = useHtmlCanvas({
    context: "webgl2",
    mode: rendering,
    animating: turn !== null,
    setup: (ctx) => {
      gl.current = { program: createProgram(ctx, PAGE_VERT, PAGE_FRAG), flat: createGrid(ctx), sheet: createGrid(ctx, 24, 1) };
      return () => {
        textures.current.forEach((t) => ctx.deleteTexture(t.texture));
        textures.current.clear();
        if (gl.current) ctx.deleteProgram(gl.current.program.program);
        gl.current = null;
      };
    },
    render: ({ ctx, canvas, width, height: h, reason, changed, delta }) => {
      const g = gl.current;
      if (!g) return;
      const tex = (index: number) => {
        const el = pageRefs.current.get(index);
        if (!el) return null;
        let t = textures.current.get(index);
        if (!t) {
          t = createElementTexture(ctx);
          textures.current.set(index, t);
        }
        if (reason === "resize" || reason === "request" || !t.width || changed.some((c) => c === el || el.contains(c))) uploadElementTexture(ctx, t, el);
        return t;
      };
      const book = new DOMMatrix()
        .translate(width / 2, h / 2 + HEADROOM / 2)
        .multiply(perspective(DISTANCE))
        .rotate(TILT, 0, 0)
        .translate(0, -ph / 2);

      // Advance a turn (or follow a drag).
      const ts = turnState.current;
      if (turn && !ts.dragging && reason === "frame") {
        ts.progress += (ts.target - ts.progress) * (1 - Math.exp(-delta * 7));
        if (Math.abs(ts.target - ts.progress) < 0.004) {
          ts.progress = ts.target;
          const done = ts.target === 1;
          window.setTimeout(() => {
            setTurn(null);
            if (done) commit(spread + turn.dir);
          }, 0);
        }
      }

      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.useProgram(g.program.program);
      const { u } = g.program;
      ctx.uniform2f(u("u_canvas"), width, h);
      ctx.uniform2f(u("u_size"), pw, ph);
      setMatrix(ctx, u("u_book"), book);
      ctx.uniform1i(u("u_front"), 0);
      ctx.uniform1i(u("u_back"), 1);

      const drawFlat = (index: number, side: -1 | 1) => {
        const t = tex(index);
        if (!t) return;
        ctx.uniform1f(u("u_side"), side);
        ctx.activeTexture(ctx.TEXTURE0);
        ctx.bindTexture(ctx.TEXTURE_2D, t.texture);
        drawMesh(ctx, g.flat);
      };
      // Underneath during a turn: forward shows the next right page, backward the previous left page.
      const baseLeft = turn && turn.dir < 0 ? left - 2 : left;
      const baseRight = turn && turn.dir > 0 ? right + 2 : right;
      drawFlat(baseLeft, -1);
      drawFlat(baseRight, 1);

      if (turn) {
        const front = tex(turn.dir > 0 ? right : left - 1);
        const back = tex(turn.dir > 0 ? right + 1 : left);
        if (front) {
          ctx.uniform1f(u("u_side"), 0);
          ctx.uniform1f(u("u_progress"), ts.progress);
          ctx.uniform1f(u("u_dir"), turn.dir);
          ctx.activeTexture(ctx.TEXTURE0);
          ctx.bindTexture(ctx.TEXTURE_2D, front.texture);
          ctx.activeTexture(ctx.TEXTURE1);
          ctx.bindTexture(ctx.TEXTURE_2D, (back ?? front).texture);
          drawMesh(ctx, g.sheet);
        }
      }

      // Sync the open spread so selection and clicks land on the drawn pages.
      if (!turn) {
        const l = pageRefs.current.get(left);
        const r = pageRefs.current.get(right);
        if (l) syncElementGeometry(canvas, l, book.translate(-pw, 0));
        if (r) syncElementGeometry(canvas, r, book);
      }
    },
  });

  useEffect(() => onModeChange?.(native), [native, onModeChange]);

  const start = (dir: 1 | -1) => {
    if (turn) return;
    const next = spread + dir;
    if (next < 0 || next >= spreads) return;
    if (!native || reduceMotion) {
      commit(next);
      return;
    }
    turnState.current = { progress: 0, target: 1, dragging: false, startX: 0 };
    setTurn({ dir });
    invalidate();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if ((event.target as HTMLElement).closest("input, textarea, select")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      start(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      start(-1);
    }
  };

  // Dragging the outer edge of a page turns it, following the pointer.
  const onEdgeDown = (dir: 1 | -1, event: React.PointerEvent<HTMLButtonElement>) => {
    if (!native || turn) return;
    const next = spread + dir;
    if (next < 0 || next >= spreads) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    turnState.current = { progress: 0, target: 1, dragging: true, startX: event.clientX };
    setTurn({ dir });
  };
  const onEdgeMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ts = turnState.current;
    if (!ts.dragging || !turn) return;
    const dx = (event.clientX - ts.startX) * -turn.dir;
    ts.progress = Math.max(0, Math.min(1, dx / (pw * 1.6)));
    invalidate();
  };
  const onEdgeUp = () => {
    const ts = turnState.current;
    if (!ts.dragging) return;
    ts.dragging = false;
    ts.target = ts.progress > 0.35 ? 1 : 0;
    invalidate();
  };

  const counter = `${Math.min(pages.length, left + 1)}–${Math.min(pages.length, right + 1)} of ${pages.length}`;
  const pageClass = "overflow-hidden bg-[#fcfaf6] text-[#2a2723]";

  const controls = (
    <div className="mt-3 flex items-center justify-center gap-3">
      <button type="button" onClick={() => start(-1)} disabled={spread === 0 || turn !== null} aria-label="Previous pages" className="grid size-9 cursor-pointer place-items-center rounded-full border border-border text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40">
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      <span className="min-w-[6rem] text-center text-[12px] text-muted-foreground tabular-nums" aria-live="polite">
        Pages {counter}
      </span>
      <button type="button" onClick={() => start(1)} disabled={spread >= spreads - 1 || turn !== null} aria-label="Next pages" className="grid size-9 cursor-pointer place-items-center rounded-full border border-border text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40">
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );

  if (!native) {
    return (
      <div className={cn("flex w-full flex-col items-center", className)}>
        <div role="group" aria-roledescription="book" aria-label={label} tabIndex={0} onKeyDown={onKeyDown} className="flex max-w-full rounded-md shadow-[0_18px_40px_-20px_rgb(0_0_0/0.45)] outline-none [perspective:1600px] focus-visible:ring-2 focus-visible:ring-ring">
          {[left, right].map((index, i) => (
            <div key={`${spread}-${i}`} className={cn("relative", i === 0 ? "origin-right" : "origin-left")} style={{ width: pw, height: ph }}>
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={index}
                  initial={reduceMotion ? { opacity: 0 } : { rotateY: i === 0 ? 70 : -70, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("absolute inset-0", pageClass, i === 0 ? "origin-right" : "origin-left")}
                  style={{ boxShadow: i === 0 ? "inset -14px 0 18px -14px rgb(0 0 0 / 0.3)" : "inset 14px 0 18px -14px rgb(0 0 0 / 0.3)" }}
                >
                  {pages[index] ?? null}
                </motion.div>
              </AnimatePresence>
            </div>
          ))}
        </div>
        {controls}
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <div
        role="group"
        aria-roledescription="book"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative max-w-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ width: pw * 2 + MARGIN * 2, height: ph + MARGIN * 2 + HEADROOM }}
      >
        <canvas ref={canvasRef} {...canvasProps} id={`${id}-pages`} className="absolute inset-0 block size-full">
          {pages.map((page, index) => {
            const visible = !turn && (index === left || index === right);
            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) pageRefs.current.set(index, el);
                  else pageRefs.current.delete(index);
                }}
                aria-hidden={!visible}
                inert={!visible}
                className={pageClass}
                style={{ width: pw, height: ph, visibility: involved.includes(index) ? "visible" : "hidden" }}
              >
                {page}
              </div>
            );
          })}
        </canvas>
        {/* Page edges: drag to turn. */}
        <button type="button" tabIndex={-1} aria-hidden="true" onPointerDown={(e) => onEdgeDown(1, e)} onPointerMove={onEdgeMove} onPointerUp={onEdgeUp} onPointerCancel={onEdgeUp} className="absolute cursor-grab touch-none" style={{ right: MARGIN - 8, top: MARGIN + HEADROOM, width: 28, height: ph }} />
        <button type="button" tabIndex={-1} aria-hidden="true" onPointerDown={(e) => onEdgeDown(-1, e)} onPointerMove={onEdgeMove} onPointerUp={onEdgeUp} onPointerCancel={onEdgeUp} className="absolute cursor-grab touch-none" style={{ left: MARGIN - 8, top: MARGIN + HEADROOM, width: 28, height: ph }} />
      </div>
      {controls}
    </div>
  );
}
