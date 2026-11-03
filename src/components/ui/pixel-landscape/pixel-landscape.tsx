"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PixelLandscapeColors {
  /** Sky behind everything. */
  sky: string;
  /** The fine texture of dots across the sky. */
  skyDot: string;
  /** Shadowed slopes. */
  shadow: string;
  /** Mid-lit slopes. */
  mid: string;
  /** Sunlit slopes. */
  lit: string;
  /** Sparse vegetation flecks. */
  accent: string;
  /** Cloud colors from deep to bright. */
  cloud: [string, string, string];
}

export interface PixelLandscapeProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content above the landscape, e.g. a hero. */
  children?: ReactNode;
  /** Cell size in px; each cell is one dot. @default 7 */
  cell?: number;
  /** Dot shape. @default "circle" */
  shape?: "circle" | "square";
  /** Built-in palette, or your own colors (any CSS color). @default "ember" */
  palette?: "ember" | "alpine" | "dusk" | Partial<PixelLandscapeColors>;
  /** How much of the height the mountains reach, 0–1. @default 0.58 */
  height?: number;
  /** Changes the shape of the range. @default 7 */
  seed?: number;
  /** A dithered cloud drifting across the sky. @default true */
  cloud?: boolean;
  /** The sun follows the pointer, relighting the slopes. @default true */
  interactive?: boolean;
  /** Freezes the cloud. @default false */
  paused?: boolean;
}

const PALETTES: Record<"ember" | "alpine" | "dusk", PixelLandscapeColors> = {
  ember: { sky: "#cdd9ee", skyDot: "#e3eaf6", shadow: "#141414", mid: "#f2581d", lit: "#d9e021", accent: "#13a85b", cloud: ["#1d6fd8", "#7fb6ee", "#f4f7fb"] },
  alpine: { sky: "#e6eef5", skyDot: "#f3f7fa", shadow: "#23313f", mid: "#5b7c99", lit: "#e8edf2", accent: "#7fb08a", cloud: ["#9fb3c8", "#d4dfe9", "#ffffff"] },
  dusk: { sky: "#f6d9cf", skyDot: "#fae8e1", shadow: "#2b1638", mid: "#b5367a", lit: "#ffb057", accent: "#5c3a8f", cloud: ["#7a4bb0", "#d595c9", "#fff1ea"] },
};

const hash = (x: number, y: number, s = 0) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

function noise(x: number, y: number, s: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s);
  const b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s);
  const d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Ridged multi-octave noise: sharp crests, like eroded ranges. */
function ridged(x: number, s: number) {
  let sum = 0;
  let amp = 0.6;
  let freq = 1;
  for (let o = 0; o < 4; o++) {
    const n = 1 - Math.abs(noise(x * freq, o * 17.3, s) * 2 - 1);
    sum += n * n * amp;
    amp *= 0.42;
    freq *= 2.3;
  }
  return sum;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

function resolve(palette: PixelLandscapeProps["palette"]): PixelLandscapeColors {
  if (!palette || typeof palette === "string") return PALETTES[palette ?? "ember"];
  return { ...PALETTES.ember, ...palette };
}

/**
 * A mountain range drawn as a mosaic of dots: ridged noise shapes the crests, slopes are shaded by
 * their angle to the sun (dark, mid and lit bands with a few green flecks), a fine dot texture fills
 * the sky, and a dithered cloud drifts past. The sun follows the pointer and relights the range.
 * Drawn on a 2D canvas; the range is only redrawn when the light or size changes.
 */
export function PixelLandscape({
  children,
  cell = 7,
  shape = "circle",
  palette = "ember",
  height = 0.58,
  seed = 7,
  cloud = true,
  interactive = true,
  paused = false,
  className,
  style,
  ...props
}: PixelLandscapeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = resolve(palette);
  const live = useRef({ colors, interactive, paused });
  useEffect(() => {
    live.current = { colors, interactive, paused };
  });
  const paletteKey = JSON.stringify(colors);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const terrain = document.createElement("canvas");
    const tctx = terrain.getContext("2d");
    if (!tctx) return;

    let width = 0;
    let heightPx = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let ridge: number[] = [];
    let frame = 0;
    let visible = true;
    let dirty = true;
    let time = 0;
    let last = performance.now();
    const sun = { x: 0.25, y: -0.4, tx: 0.25, ty: -0.4 };

    /** Mountain top per column, in rows from the top. */
    const buildRidge = () => {
      ridge = Array.from({ length: cols }, (_, gx) => {
        const x = gx / Math.max(1, cols);
        const far = ridged(x * 1.3 + seed * 3.1, seed);
        const near = ridged(x * 2.1 + seed * 1.7 + 40, seed + 1);
        const h = Math.max(far * 0.85, near * 1.05) * Math.max(0.1, Math.min(1, height)) * 1.55;
        return Math.round(rows * (1 - Math.min(0.96, h)));
      });
    };

    const paintTerrain = () => {
      const c = live.current.colors;
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tctx.clearRect(0, 0, width, heightPx);
      // Sky texture: a meandering field of lighter dots.
      const skyPath = new Path2D();
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          if (gy >= ridge[gx]) continue;
          const n = noise(gx * 0.22, gy * 0.22, seed + 9);
          if ((gx + gy) % 2 === 0 && n > 0.42) skyPath.rect(gx * cell + cell * 0.3, gy * cell + cell * 0.3, cell * 0.4, cell * 0.4);
        }
      }
      tctx.fillStyle = c.skyDot;
      tctx.fill(skyPath);
      // Slopes: a 2D surface (broad massifs, gullies and fine rock) lit by the sun. The normal comes from
      // finite differences, plus the range's own left/right slope near the crest.
      const surface = (x: number, y: number) => noise(x * 0.05, y * 0.05, seed + 3) * 0.55 + ridged(x * 0.045 + y * 0.03, seed + 4) * 0.3 + noise(x * 0.3, y * 0.3, seed + 6) * 0.15;
      const lx = sun.x * 2 - 1;
      const ly = -0.55 - sun.y * 0.4;
      const bands: Record<string, Path2D> = { shadow: new Path2D(), mid: new Path2D(), lit: new Path2D(), accent: new Path2D() };
      for (let gx = 0; gx < cols; gx++) {
        const top = ridge[gx];
        const macro = (ridge[Math.min(cols - 1, gx + 3)] - ridge[Math.max(0, gx - 3)]) / 6;
        for (let gy = top; gy < rows; gy++) {
          const depth = (gy - top) / Math.max(1, rows - top);
          const nx = (surface(gx + 1, gy) - surface(gx - 1, gy)) * 9 + macro * 0.6 * (1 - depth * 0.7);
          const ny = (surface(gx, gy + 1) - surface(gx, gy - 1)) * 9;
          const facing = -(nx * lx + ny * ly) + (1 - depth) * 0.12;
          const flick = hash(gx, gy, seed);
          let band: keyof typeof bands = facing > 0.16 ? "lit" : facing > -0.14 ? "mid" : "shadow";
          if (band !== "shadow" && flick > 0.985) band = "accent";
          if (flick < 0.035 && depth > 0.1) continue; // a few gaps keep it pixelated
          const path = bands[band];
          const r = cell * (band === "shadow" ? 0.44 : 0.4);
          const cx = gx * cell + cell / 2;
          const cy = gy * cell + cell / 2;
          if (shape === "square") path.rect(cx - r, cy - r, r * 2, r * 2);
          else {
            path.moveTo(cx + r, cy);
            path.arc(cx, cy, r, 0, Math.PI * 2);
          }
        }
      }
      tctx.fillStyle = c.shadow;
      tctx.fill(bands.shadow);
      tctx.fillStyle = c.mid;
      tctx.fill(bands.mid);
      tctx.fillStyle = c.lit;
      tctx.fill(bands.lit);
      tctx.fillStyle = c.accent;
      tctx.fill(bands.accent);
      dirty = false;
    };

    const draw = () => {
      const c = live.current.colors;
      if (dirty) paintTerrain();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = c.sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(terrain, 0, 0);
      if (!cloud) return;
      // Cloud: a soft blob, dithered at its edge, drifting slowly to the right.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = Math.min(width, heightPx) * 0.17;
      const cxp = ((0.72 * width + time * 6) % (width + r * 2)) - r * 0.2;
      const cyp = heightPx * 0.32;
      const g0 = Math.floor((cxp - r * 1.4) / cell);
      const g1 = Math.ceil((cxp + r * 1.4) / cell);
      const h0 = Math.floor((cyp - r) / cell);
      const h1 = Math.ceil((cyp + r) / cell);
      for (let gy = h0; gy <= h1; gy++) {
        for (let gx = g0; gx <= g1; gx++) {
          if (gx < 0 || gy < 0 || gx >= cols || gy >= rows || gy >= ridge[gx]) continue;
          const dx = (gx * cell + cell / 2 - cxp) / (r * 1.35);
          const dy = (gy * cell + cell / 2 - cyp) / r;
          const n = noise(gx * 0.18 + time * 0.05, gy * 0.18, seed + 5);
          const d = Math.sqrt(dx * dx + dy * dy) - (n - 0.5) * 0.5;
          if (d > 1) continue;
          const threshold = BAYER[(gy % 4) * 4 + (gx % 4)];
          if (d > 0.62 && (d - 0.62) / 0.38 > threshold) continue;
          const tone = n + (1 - d) * 0.3 - dy * 0.25;
          ctx.fillStyle = tone > 0.95 ? c.cloud[2] : tone > 0.62 ? c.cloud[1] : c.cloud[0];
          ctx.fillRect(gx * cell + 0.5, gy * cell + 0.5, cell - 1, cell - 1);
        }
      }
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!live.current.paused) time += dt;
      // Ease the sun toward the pointer; relight only when it has moved enough.
      const nx = sun.x + (sun.tx - sun.x) * Math.min(1, dt * 3);
      const ny = sun.y + (sun.ty - sun.y) * Math.min(1, dt * 3);
      if (Math.abs(nx - sun.x) + Math.abs(ny - sun.y) > 0.004) dirty = true;
      sun.x = nx;
      sun.y = ny;
      draw();
      schedule();
    };
    const schedule = () => {
      if (!frame && visible && !document.hidden && !reduceMotion) frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, rect.width);
      heightPx = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = terrain.width = Math.round(width * dpr);
      canvas.height = terrain.height = Math.round(heightPx * dpr);
      cols = Math.ceil(width / cell);
      rows = Math.ceil(heightPx / cell);
      buildRidge();
      dirty = true;
      draw();
    };

    const onMove = (e: PointerEvent) => {
      if (!live.current.interactive || e.pointerType === "touch") return;
      const rect = root.getBoundingClientRect();
      sun.tx = (e.clientX - rect.left) / rect.width;
      sun.ty = (e.clientY - rect.top) / rect.height - 0.6;
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
    resize();
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("pointermove", onMove);
    };
  }, [cell, shape, height, seed, cloud, paletteKey]);

  return (
    <div ref={rootRef} className={cn("relative isolate overflow-hidden", className)} style={{ background: colors.sky, ...style }} {...props}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />
      {children}
    </div>
  );
}
