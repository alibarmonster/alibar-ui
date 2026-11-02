"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Trash2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, setMatrix, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas, type HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

export interface DisintegrateItem {
  id: string;
  title: string;
  subtitle?: string;
  /** Leading visual, e.g. an icon or avatar. */
  icon?: ReactNode;
}

export interface DisintegrateDeleteProps {
  /** Starting rows. The list manages deletes and undos itself. */
  items: DisintegrateItem[];
  /** Called when a row is deleted. */
  onDelete?: (item: DisintegrateItem) => void;
  /** Called when a deleted row is restored with Undo. */
  onRestore?: (item: DisintegrateItem) => void;
  /** Milliseconds the Undo toast stays. @default 5000 */
  undoTimeout?: number;
  /** Seconds the dust takes. @default 1.1 */
  dustDuration?: number;
  /** Accessible name for the list. @default "Items" */
  label?: string;
  /** Message when every row is gone. @default "Nothing here." */
  emptyMessage?: string;
  /** "auto" uses HTML-in-Canvas when available, "fallback" never does. @default "auto" */
  rendering?: HtmlCanvasMode;
  /** Called when the rendering mode is known. */
  onModeChange?: (native: boolean) => void;
  /** Classes for the root. */
  className?: string;
}

const CELL = 3;

const QUAD_VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform mat4 u_matrix;
uniform vec2 u_size;
out vec2 v_uv;
${PROJECT_GLSL}
void main() {
  v_uv = a_pos;
  gl_Position = projectCss(u_matrix * vec4(a_pos * u_size, 0.0, 1.0));
}`;

const QUAD_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_alpha;
out vec4 outColor;
void main() { outColor = texture(u_tex, v_uv) * u_alpha; }`;

const DUST_VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform vec2 u_offset;
uniform vec2 u_grid;
uniform float u_t;
out vec2 v_uv;
out float v_alpha;
${PROJECT_GLSL}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float cols = u_grid.x;
  vec2 cell = vec2(mod(float(gl_InstanceID), cols), floor(float(gl_InstanceID) / cols));
  float r = hash(cell);
  float r2 = hash(cell + 17.0);
  // A sweep from left to right with some scatter, like dust blown off the row.
  float delay = (cell.x / cols) * 0.5 + r * 0.18;
  float local = clamp((u_t - delay) / 0.42, 0.0, 1.0);
  float e = local * local;
  vec2 dir = normalize(vec2(0.55 + r * 0.9, -1.0 - r2 * 0.7));
  vec2 drift = dir * e * (50.0 + r2 * 110.0) + vec2(sin(r * 30.0 + e * 7.0) * 9.0 * e, 0.0);
  float size = ${CELL.toFixed(1)} * (1.0 - e * 0.5) + 0.35;
  vec2 p = u_offset + (cell + 0.5) * ${CELL.toFixed(1)} + drift + (a_pos - 0.5) * size;
  v_uv = (cell + a_pos) / u_grid;
  v_alpha = 1.0 - smoothstep(0.35, 1.0, local);
  gl_Position = projectCss(vec4(p, 0.0, 1.0));
}`;

const DUST_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
in float v_alpha;
uniform sampler2D u_tex;
uniform vec2 u_texScale;
out vec4 outColor;
void main() { outColor = texture(u_tex, min(v_uv * u_texScale, vec2(0.999))) * v_alpha; }`;

type Dust = { id: string; item: DisintegrateItem; index: number; texture: ElementTexture; top: number; start: number; reverse: boolean; finished?: boolean };

/** Milliseconds from a monotonic clock (read in callbacks, never during render). */
const nowMs = () => performance.now();

/** Room above the list for dust to drift into, in px. */
const HEADROOM = 88;

/**
 * A list where deleting a row (live DOM with real buttons) makes it disintegrate through
 * HTML-in-Canvas: the row's pixels break into dust that drifts up and fades, then the gap closes. An
 * Undo toast reassembles the row in reverse. Without the API, rows fade and collapse.
 */
export function DisintegrateDelete({
  items: initial,
  onDelete,
  onRestore,
  undoTimeout = 5000,
  dustDuration = 1.1,
  label = "Items",
  emptyMessage = "Nothing here.",
  rendering = "auto",
  onModeChange,
  className,
}: DisintegrateDeleteProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState(initial);
  const [toast, setToast] = useState<{ item: DisintegrateItem; index: number; key: number } | null>(null);
  const [announce, setAnnounce] = useState("");
  const [animating, setAnimating] = useState(false);
  const rows = useRef(new Map<string, HTMLDivElement>());
  const textures = useRef(new Map<string, ElementTexture>());
  const drawnY = useRef(new Map<string, number>());
  const dust = useRef<Dust[]>([]);
  const progs = useRef<{ quad: Program; dust: Program; mesh: Mesh } | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const focusAfter = useRef<string | null>(null);
  // Canvas children all lay out at the canvas origin, so the list stacks its rows itself.
  const order = useRef<string[]>(initial.map((i) => i.id));
  useEffect(() => {
    order.current = items.map((i) => i.id);
  }, [items]);
  const stack = () => {
    const tops = new Map<string, number>();
    let y = HEADROOM;
    order.current.forEach((rowId) => {
      const row = rows.current.get(rowId);
      if (!row) return;
      tops.set(rowId, y);
      y += row.offsetHeight;
    });
    return { tops, bottom: y };
  };

  const { native, canvasRef, canvasProps, invalidate } = useHtmlCanvas({
    context: "webgl2",
    mode: rendering,
    animating,
    setup: (ctx) => {
      glRef.current = ctx;
      progs.current = { quad: createProgram(ctx, QUAD_VERT, QUAD_FRAG), dust: createProgram(ctx, DUST_VERT, DUST_FRAG), mesh: createGrid(ctx) };
      return () => {
        textures.current.forEach((t) => ctx.deleteTexture(t.texture));
        textures.current.clear();
        dust.current.forEach((d) => ctx.deleteTexture(d.texture.texture));
        dust.current = [];
        if (progs.current) {
          ctx.deleteProgram(progs.current.quad.program);
          ctx.deleteProgram(progs.current.dust.program);
        }
        progs.current = null;
        glRef.current = null;
      };
    },
    render: ({ ctx, canvas, width, height: h, reason, changed, delta }) => {
      const p = progs.current;
      if (!p) return;
      const now = nowMs();
      let moving = false;

      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.enable(ctx.BLEND);
      ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);

      // Rows: upload what repainted, ease each row toward its layout position, sync its geometry.
      ctx.useProgram(p.quad.program);
      ctx.uniform2f(p.quad.u("u_canvas"), width, h);
      const reforming = new Set(dust.current.filter((d) => d.reverse).map((d) => d.id));
      const { tops } = stack();
      rows.current.forEach((row, rowId) => {
        let tex = textures.current.get(rowId);
        if (!tex) {
          tex = createElementTexture(ctx);
          textures.current.set(rowId, tex);
        }
        const repainted = reason === "resize" || reason === "request" || !tex.width || changed.some((el) => el === row || row.contains(el));
        if (repainted) uploadElementTexture(ctx, tex, row);
        const target = tops.get(rowId) ?? HEADROOM;
        const prev = drawnY.current.get(rowId) ?? target;
        const y = Math.abs(target - prev) < 0.4 ? target : prev + (target - prev) * (1 - Math.exp(-delta * 14));
        if (y !== target) moving = true;
        drawnY.current.set(rowId, y);
        const m = new DOMMatrix().translate(0, y);
        // Sync hit-testing when the row repaints or comes to rest, not on every frame of the slide:
        // moving the element triggers a repaint (and a texture upload) of its own.
        const settled = y === target && prev !== target;
        if (repainted || settled) syncElementGeometry(canvas, row, m);
        if (reforming.has(rowId)) return;
        setMatrix(ctx, p.quad.u("u_matrix"), m);
        ctx.uniform2f(p.quad.u("u_size"), tex.width || row.offsetWidth, tex.height || row.offsetHeight);
        ctx.uniform1f(p.quad.u("u_alpha"), 1);
        ctx.activeTexture(ctx.TEXTURE0);
        ctx.bindTexture(ctx.TEXTURE_2D, tex.texture);
        ctx.uniform1i(p.quad.u("u_tex"), 0);
        drawMesh(ctx, p.mesh);
      });

      // Dust.
      ctx.useProgram(p.dust.program);
      ctx.uniform2f(p.dust.u("u_canvas"), width, h);
      const done: Dust[] = [];
      dust.current.forEach((d) => {
        if (d.finished) return;
        const t = Math.min(1, (now - d.start) / 1000 / dustDuration);
        if (t >= 1) done.push(d);
        else moving = true;
        const top = d.reverse ? (drawnY.current.get(d.id) ?? d.top) : d.top;
        const cols = Math.ceil(d.texture.width / CELL);
        const rowsN = Math.ceil(d.texture.height / CELL);
        ctx.uniform2f(p.dust.u("u_offset"), 0, top);
        ctx.uniform2f(p.dust.u("u_grid"), cols, rowsN);
        ctx.uniform2f(p.dust.u("u_texScale"), (cols * CELL) / d.texture.width, (rowsN * CELL) / d.texture.height);
        ctx.uniform1f(p.dust.u("u_t"), d.reverse ? 1 - t : t);
        ctx.activeTexture(ctx.TEXTURE0);
        ctx.bindTexture(ctx.TEXTURE_2D, d.texture.texture);
        ctx.uniform1i(p.dust.u("u_tex"), 0);
        drawMesh(ctx, p.mesh, cols * rowsN);
      });
      if (done.length) {
        // A finished reassembly shows the live row again; a finished deletion keeps its texture for Undo.
        dust.current = dust.current.filter((d) => !(done.includes(d) && d.reverse));
        dust.current.forEach((d) => {
          if (done.includes(d)) d.finished = true;
        });
        moving = true;
      }
      if (!moving && animating) window.setTimeout(() => setAnimating(false), 0);
    },
  });

  useEffect(() => onModeChange?.(native), [native, onModeChange]);

  // The canvas is as tall as its rows.
  useEffect(() => {
    if (!native) return;
    const measure = () => setHeight(stack().bottom - HEADROOM);
    const observer = new ResizeObserver(measure);
    rows.current.forEach((row) => observer.observe(row));
    measure();
    return () => observer.disconnect();
  }, [native, items]);

  // The toast dismisses itself; once Undo is gone, finished deletions free their textures.
  useEffect(() => {
    if (!toast) {
      const ctx = glRef.current;
      dust.current = dust.current.filter((d) => {
        if (!d.finished || d.reverse) return true;
        ctx?.deleteTexture(d.texture.texture);
        return false;
      });
      return;
    }
    const timer = window.setTimeout(() => setToast(null), undoTimeout);
    return () => window.clearTimeout(timer);
  }, [toast, undoTimeout]);

  // Move focus to the row that took a deleted row's place, or to the restored row.
  useEffect(() => {
    const target = focusAfter.current;
    if (!target) return;
    focusAfter.current = null;
    const row = rows.current.get(target) ?? document.getElementById(`${id}-${target}`);
    row?.querySelector<HTMLElement>("button")?.focus();
  }, [items, id]);

  const remove = (item: DisintegrateItem) => {
    const index = items.findIndex((i) => i.id === item.id);
    if (index < 0) return;
    const ctx = glRef.current;
    const tex = textures.current.get(item.id);
    if (native && ctx && tex && tex.width) {
      textures.current.delete(item.id);
      dust.current.forEach((d) => d.id !== item.id || ctx.deleteTexture(d.texture.texture));
      dust.current = [...dust.current.filter((d) => d.id !== item.id), { id: item.id, item, index, texture: tex, top: drawnY.current.get(item.id) ?? 0, start: nowMs(), reverse: false }];
      drawnY.current.delete(item.id);
      setAnimating(true);
    }
    const next = items[index + 1] ?? items[index - 1];
    focusAfter.current = next?.id ?? null;
    setItems((list) => list.filter((i) => i.id !== item.id));
    setToast({ item, index, key: nowMs() });
    setAnnounce(`Deleted ${item.title}. Undo is available.`);
    onDelete?.(item);
    invalidate();
  };

  const undo = () => {
    if (!toast) return;
    const { item, index } = toast;
    setItems((list) => {
      const copy = list.filter((i) => i.id !== item.id);
      copy.splice(Math.min(index, copy.length), 0, item);
      return copy;
    });
    const old = dust.current.find((d) => d.id === item.id && !d.reverse);
    if (native && old) {
      // Reassemble: play the same dust backwards over the row's new slot, then show the live row.
      dust.current = [...dust.current.filter((d) => d !== old), { ...old, start: nowMs(), reverse: true }];
      textures.current.set(item.id, old.texture);
      setAnimating(true);
    }
    focusAfter.current = item.id;
    setToast(null);
    setAnnounce(`Restored ${item.title}.`);
    onRestore?.(item);
    invalidate();
  };

  const rowClass = "flex w-full items-center gap-3 border-b border-border bg-background px-3 py-3 last:border-b-0";
  const rowContent = (item: DisintegrateItem) => (
    <>
      {item.icon ? <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-foreground">{item.icon}</span> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        {item.subtitle ? <p className="truncate text-[12px] text-muted-foreground">{item.subtitle}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => remove(item)}
        aria-label={`Delete ${item.title}`}
        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </>
  );

  const toastEl = (
    <div aria-live="polite" className="mt-3 flex min-h-11 justify-center">
      <span className="sr-only">{announce}</span>
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.key}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: duration.quick } }}
            transition={{ duration: duration.base, ease: ease.out }}
            className="flex items-center gap-3 rounded-full bg-foreground py-1.5 pr-1.5 pl-4 text-[13px] text-background shadow-lg"
          >
            <span className="max-w-[14rem] truncate">Deleted {toast.item.title}</span>
            <button type="button" onClick={undo} className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-background/15 px-3 font-medium outline-none hover:bg-background/25 focus-visible:ring-2 focus-visible:ring-background">
              <Undo2 className="size-3.5" aria-hidden="true" />
              Undo
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  const empty = items.length === 0 ? <p className="px-3 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p> : null;

  if (!native) {
    return (
      <div className={cn("w-full max-w-md", className)}>
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <ul aria-label={label}>
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  id={`${id}-${item.id}`}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: reduceMotion ? duration.quick : duration.base, ease: ease.out }}
                  className="overflow-hidden"
                >
                  <div className={rowClass}>{rowContent(item)}</div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {empty}
        </div>
        {toastEl}
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="relative overflow-visible rounded-2xl border border-border bg-background">
        <div className="relative" style={{ height: height ?? undefined }}>
          {/* The canvas reaches above the list so dust can drift up; only the rows take pointer events. */}
          <canvas ref={canvasRef} {...canvasProps} role="list" aria-label={label} className="pointer-events-none absolute inset-x-0 bottom-0 block w-full" style={{ top: -HEADROOM, height: `calc(100% + ${HEADROOM}px)` }}>
            {items.map((item, index) => (
              <div
                key={item.id}
                id={`${id}-${item.id}`}
                role="listitem"
                ref={(el) => {
                  if (el) rows.current.set(item.id, el);
                  else rows.current.delete(item.id);
                }}
                className={cn(rowClass, "pointer-events-auto", index === 0 && "rounded-t-2xl", index === items.length - 1 && "rounded-b-2xl")}
              >
                {rowContent(item)}
              </div>
            ))}
          </canvas>
        </div>
        {empty}
      </div>
      {toastEl}
    </div>
  );
}
