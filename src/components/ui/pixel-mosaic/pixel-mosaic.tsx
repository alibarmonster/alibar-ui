"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PixelMosaicProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content above the mosaic. */
  children?: ReactNode;
  /** Cell colors from cool to hot. @default ["#1f2940", "#3e5bd8", "#f2c230", "#e5432a"] */
  colors?: string[];
  /** Cell size in px. @default 12 */
  cell?: number;
  /** Gap between cells in px. @default 1.5 */
  gap?: number;
  /** Which edge breaks up into scattered pixels. @default "bottom" */
  edge?: "bottom" | "top" | "both" | "none";
  /** How much of the height is solid mosaic before the edge breaks up, 0–1. @default 0.6 */
  fill?: number;
  /** Animation speed. @default 1 */
  speed?: number;
  /** The pointer warms the cells around it. @default true */
  interactive?: boolean;
  /** Freezes the mosaic. @default false */
  paused?: boolean;
}

const hash = (x: number, y: number) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const fbm = (x: number, y: number) => noise(x, y) * 0.55 + noise(x * 2.1 + 7, y * 2.1 + 3) * 0.3 + noise(x * 4.3 + 11, y * 4.3 + 5) * 0.15;

/**
 * A living band of square pixels: a slow, diagonal noise field quantized into a few colors (navy,
 * blue, yellow, red by default), with one edge breaking up into scattered cells like a dissolving
 * banner. The pointer warms the cells around it. Drawn on a 2D canvas; pauses offscreen and in hidden
 * tabs and holds one still frame under reduced motion.
 */
export function PixelMosaic({
  children,
  colors = ["#1f2940", "#3e5bd8", "#f2c230", "#e5432a"],
  cell = 12,
  gap = 1.5,
  edge = "bottom",
  fill = 0.6,
  speed = 1,
  interactive = true,
  paused = false,
  className,
  ...props
}: PixelMosaicProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ colors, speed, interactive, paused, edge, fill });
  useEffect(() => {
    live.current = { colors, speed, interactive, paused, edge, fill };
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let visible = true;
    let time = 0;
    let last = performance.now();
    const pointer = { x: -1e4, y: -1e4, heat: 0, target: 0 };

    const draw = () => {
      const { colors: palette, edge: e, fill: f } = live.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const n = palette.length;
      const t = time * 0.06;
      const size = cell - gap;
      for (let gy = 0; gy < rows; gy++) {
        const v = gy / Math.max(1, rows - 1);
        // Distance into the broken edge: 0 inside the solid band, rising toward 1 at the edge.
        const toEdge = e === "bottom" ? v : e === "top" ? 1 - v : e === "both" ? Math.abs(v - 0.5) * 2 : 0;
        for (let gx = 0; gx < cols; gx++) {
          const px = gx * cell;
          const py = gy * cell;
          // A diagonal field drifting slowly, so colors stream in streaks.
          const u = gx * 0.075 + gy * 0.05;
          let value = fbm(u + t, gy * 0.11 - gx * 0.06 - t * 0.6);
          // The center runs hotter, like light behind the band.
          value += 0.22 * Math.exp(-(((gx / cols - 0.38) * 2.4) ** 2));
          if (pointer.heat > 0.01) {
            const d2 = ((px - pointer.x) ** 2 + (py - pointer.y) ** 2) / (cell * cell * 60);
            value += pointer.heat * 0.6 * Math.exp(-d2);
          }
          // Break the edge up into ragged columns and scattered pixels.
          if (e !== "none" && toEdge > f) {
            const ragged = noise(gx * 0.18, 9.1) * 0.35 + hash(gx, gy) * 0.4;
            if ((toEdge - f) / Math.max(0.05, 1 - f) > ragged + 0.12) continue;
          }
          if (hash(gx * 3 + 1, gy * 7 + 2) < 0.025) continue;
          const band = Math.max(0, Math.min(n - 1, Math.floor((value - 0.22) * n * 1.15)));
          ctx.fillStyle = palette[band];
          ctx.fillRect(px + gap / 2, py + gap / 2, size, size);
        }
      }
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      pointer.heat += (pointer.target - pointer.heat) * Math.min(1, dt * 4);
      if (!live.current.paused) time += dt * live.current.speed;
      draw();
      schedule();
    };
    const schedule = () => {
      if (!frame && visible && !document.hidden && !reduceMotion) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const r = root.getBoundingClientRect();
      width = Math.max(1, r.width);
      height = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      draw();
    };
    const onMove = (e: PointerEvent) => {
      if (!live.current.interactive || e.pointerType === "touch") return;
      const r = root.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.target = 1;
    };
    const onLeave = () => {
      pointer.target = 0;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      last = performance.now();
      schedule();
    });
    io.observe(root);
    const onVisibility = () => {
      last = performance.now();
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    resize();
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [cell, gap]);

  return (
    <div ref={rootRef} className={cn("relative isolate overflow-hidden", className)} {...props}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />
      {children}
    </div>
  );
}
