"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { drawableCanvasAttributes, prepareDrawableCanvas, requestCanvasPaint } from "@/lib/html-canvas/setup";
import { getHtmlCanvasSupport, NO_SUPPORT, supportsContext, type HtmlCanvasSupport } from "@/lib/html-canvas/support";

export type HtmlCanvasMode = "auto" | "native" | "fallback";
type ContextType = "2d" | "webgl2";
type ContextFor<C extends ContextType> = C extends "2d" ? CanvasRenderingContext2D : WebGL2RenderingContext;

export interface HtmlCanvasFrame<C extends ContextType> {
  ctx: ContextFor<C>;
  canvas: HTMLCanvasElement;
  /** Canvas size in CSS px. */
  width: number;
  height: number;
  /** Device pixels per CSS px used for the backing store (capped). */
  dpr: number;
  /** Seconds since the hook started. */
  time: number;
  /** Seconds since the previous render. */
  delta: number;
  /** Why this render happened: drawn elements repainted, the canvas resized, or an animation frame. */
  reason: "paint" | "resize" | "frame" | "request";
  /** Elements that repainted (from the paint event), when known. */
  changed: readonly Element[];
}

export interface UseHtmlCanvasOptions<C extends ContextType> {
  /** Context to draw with. */
  context: C;
  /** "auto" uses the API when available, "fallback" never does, "native" requires it. @default "auto" */
  mode?: HtmlCanvasMode;
  /** Run a render every frame while true (e.g. while a ripple is fading). Paused offscreen and in hidden tabs. */
  animating?: boolean;
  /** Called once per context (again after a lost context is restored). Return a cleanup. */
  setup?: (ctx: ContextFor<C>, canvas: HTMLCanvasElement) => void | (() => void);
  /** Draws a frame. Upload element textures only when `reason` is "paint" or "resize". */
  render: (frame: HtmlCanvasFrame<C>) => void;
  /** Highest device pixel ratio for the backing store. @default 2 */
  maxDpr?: number;
  /** Context attributes for WebGL. */
  contextAttributes?: WebGLContextAttributes;
}

export interface HtmlCanvasController {
  /** True when the canvas path is active; render the fallback DOM otherwise. */
  native: boolean;
  /** What the browser supports (none on the server and during hydration). */
  support: HtmlCanvasSupport;
  /** Ref for the <canvas>. */
  canvasRef: (canvas: HTMLCanvasElement | null) => void;
  /** Spread onto the <canvas> so it lays out and paints its children from the first layout. */
  canvasProps: Record<string, string>;
  /** Asks for one more render (and a browser paint event where supported). */
  invalidate: () => void;
}

const noop = () => () => {};

/**
 * Ties the HTML-in-Canvas adapter together: decides native vs. fallback (never during SSR or
 * hydration, never under reduced motion), prepares the canvas, renders on the canvas `paint` event
 * and on resize, runs a frame loop only while `animating`, pauses offscreen and in hidden tabs,
 * recovers from a lost WebGL context and cleans up on unmount.
 */
export function useHtmlCanvas<C extends ContextType>({
  context,
  mode = "auto",
  animating = false,
  setup,
  render,
  maxDpr = 2,
  contextAttributes,
}: UseHtmlCanvasOptions<C>): HtmlCanvasController {
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const reduceMotion = useReducedMotion();
  const support = hydrated ? getHtmlCanvasSupport() : NO_SUPPORT;
  const [failed, setFailed] = useState(false);
  const native = hydrated && !failed && mode !== "fallback" && !reduceMotion && supportsContext(support, context);

  // The element lives in a ref (it is mutated: size, attributes); the counter re-runs the effect when it changes.
  const canvasEl = useRef<HTMLCanvasElement | null>(null);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const canvasRef = useCallback((el: HTMLCanvasElement | null) => {
    if (canvasEl.current === el) return;
    canvasEl.current = el;
    setCanvasVersion((v) => v + 1);
  }, []);
  const renderRef = useRef(render);
  const setupRef = useRef(setup);
  const animatingRef = useRef(animating);
  useLayoutEffect(() => {
    renderRef.current = render;
    setupRef.current = setup;
    animatingRef.current = animating;
  });
  const kick = useRef<(reason: HtmlCanvasFrame<C>["reason"]) => void>(() => {});

  useEffect(() => {
    const canvas = canvasEl.current;
    if (!native || !canvas) return;
    prepareDrawableCanvas(canvas);
    const ctx = canvas.getContext(context, context === "webgl2" ? { alpha: true, premultipliedAlpha: true, antialias: true, ...contextAttributes } : undefined) as ContextFor<C> | null;
    if (!ctx) {
      // Defer so the state change happens outside the effect body.
      const t = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(t);
    }
    let cleanupSetup: void | (() => void);
    let ready = false;
    const runSetup = () => {
      try {
        cleanupSetup = setupRef.current?.(ctx, canvas);
        ready = true;
      } catch (error) {
        console.error(error);
        ready = false;
        window.setTimeout(() => setFailed(true), 0);
      }
    };
    runSetup();

    const start = performance.now();
    let last = start;
    let size = { width: 0, height: 0, dpr: 1 };
    let visible = true;
    let frame = 0;
    let changed: readonly Element[] = [];

    const draw = (reason: HtmlCanvasFrame<C>["reason"]) => {
      if (!ready || !size.width || !size.height) return;
      const now = performance.now();
      try {
        renderRef.current({ ctx, canvas, width: size.width, height: size.height, dpr: size.dpr, time: (now - start) / 1000, delta: Math.min(0.1, (now - last) / 1000), reason, changed });
      } catch (error) {
        console.error(error);
      }
      last = now;
      changed = [];
    };

    const loop = () => {
      frame = 0;
      if (!visible || document.hidden || !animatingRef.current) return;
      draw("frame");
      frame = requestAnimationFrame(loop);
    };
    const ensureLoop = () => {
      if (!frame && visible && !document.hidden && animatingRef.current) frame = requestAnimationFrame(loop);
    };
    kick.current = (reason) => {
      draw(reason);
      ensureLoop();
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (width === size.width && height === size.height && dpr === size.dpr) return;
      size = { width, height, dpr };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      draw("resize");
      requestCanvasPaint(canvas);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const onPaint = (event: Event) => {
      changed = ((event as Event & { changedElements?: Element[] }).changedElements ?? []) as Element[];
      draw("paint");
      ensureLoop();
    };
    canvas.addEventListener("paint", onPaint);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      ensureLoop();
    });
    io.observe(canvas);
    const onVisibility = () => ensureLoop();
    document.addEventListener("visibilitychange", onVisibility);

    const onLost = (event: Event) => {
      event.preventDefault();
      ready = false;
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const onRestored = () => {
      runSetup();
      draw("resize");
      requestCanvasPaint(canvas);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    requestCanvasPaint(canvas);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      io.disconnect();
      canvas.removeEventListener("paint", onPaint);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      document.removeEventListener("visibilitychange", onVisibility);
      kick.current = () => {};
      if (typeof cleanupSetup === "function") cleanupSetup();
    };
    // contextAttributes and maxDpr are read once per canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native, canvasVersion, context]);

  // Start or stop the loop when `animating` flips.
  useEffect(() => {
    if (animating) kick.current("frame");
  }, [animating]);

  const invalidate = useCallback(() => {
    kick.current("request");
    if (canvasEl.current) requestCanvasPaint(canvasEl.current);
  }, []);

  return { native, support, canvasRef, canvasProps: drawableCanvasAttributes(support), invalidate };
}
