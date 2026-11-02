"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KoiPondColors {
  /** Water behind everything. */
  background: string;
  /** Body cells (the pale scales). */
  body: string;
  /** Glyphs on body cells. */
  bodyInk: string;
  /** Bright pattern patches (orange). */
  patch: string;
  /** Deep pattern patches (red). */
  patchDeep: string;
  /** Glyphs on patch cells. */
  patchInk: string;
  /** Dark markings (sumi). */
  dark: string;
  /** Eyes. */
  eye: string;
  /** Wakes, ripples and lily pad outlines. */
  line: string;
}

export type KoiPondPalette = "light" | "dark" | (Partial<KoiPondColors> & { base?: "light" | "dark" });

export interface AsciiKoiPondProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content above the pond, e.g. a hero. */
  children?: ReactNode;
  /** How many koi swim in the pond (1–12). @default 5 */
  koi?: number;
  /** Cell size in px; glyphs scale with it. @default 14 */
  cell?: number;
  /** Built-in light or dark colors, or your own (any CSS color). An object starts from `base`. @default "light" */
  palette?: KoiPondPalette;
  /** Drifting lily pads drawn as outlines. @default 3 */
  lilyPads?: number;
  /** Koi drift toward the cursor, scatter from fast moves, and a click drops food. @default true */
  interactive?: boolean;
  /** Show how many pellets the koi have eaten in the top-right corner. @default true */
  showCounter?: boolean;
  /** Called with the running total each time a koi eats a pellet. */
  onFeed?: (total: number) => void;
  /** Freezes the pond on its current frame. @default false */
  paused?: boolean;
}

const PALETTES: Record<"light" | "dark", KoiPondColors> = {
  light: {
    background: "#f7f6f2",
    body: "#d9d7d0",
    bodyInk: "#8f8b80",
    patch: "#ee8a3a",
    patchDeep: "#d2452a",
    patchInk: "#7a2a12",
    dark: "#3a3936",
    eye: "#2b2a27",
    line: "#b9b5aa",
  },
  dark: {
    background: "#171615",
    body: "#8d8b86",
    bodyInk: "#c9c6bf",
    patch: "#c9772f",
    patchDeep: "#a8361f",
    patchInk: "#f2d0b4",
    dark: "#2b2a28",
    eye: "#ece9e2",
    line: "#4a4844",
  },
};

/** Koi varieties: how much of the body carries pattern, and which patch colors. */
const VARIETIES = [
  { patch: 0.4, deep: 0.5, sumi: 0 }, // kohaku-like: white with red-orange
  { patch: 0.34, deep: 0.25, sumi: 0.12 }, // showa-like: with black markings
  { patch: 0.6, deep: 0.15, sumi: 0 }, // mostly orange
  { patch: 0.28, deep: 0.8, sumi: 0.04 }, // pale with deep red
] as const;

const PATCH_GLYPHS = ["X", "S", "%", "8", "X", "S"];
const BODY_GLYPHS = [".", ".", ":", ".", "·", "."];
const SEGMENTS = 16;

interface Koi {
  /** Spine points, head first, in px. */
  spine: { x: number; y: number }[];
  heading: number;
  speed: number;
  length: number;
  width: number;
  seed: number;
  variety: (typeof VARIETIES)[number];
  phase: number;
  wander: number;
  wake: { x: number; y: number; a: number; t: number }[];
}

interface Pad {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  spin: number;
  notch: number;
}

const hash = (a: number, b: number, c = 0) => {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Smooth value noise on a grid, 0–1. */
function noise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Body half-width along the spine (t = 0 at the head, 1 at the tail tip), as a share of the full width. */
function profile(t: number) {
  if (t < 0.08) return 0.55 + (t / 0.08) * 0.35;
  if (t < 0.35) return 0.9 + Math.sin(((t - 0.08) / 0.27) * Math.PI * 0.5) * 0.1;
  if (t < 0.82) return 1 - ((t - 0.35) / 0.47) ** 1.4 * 0.78;
  // The tail fans out again.
  return 0.22 + ((t - 0.82) / 0.18) * 0.62;
}

function resolvePalette(palette: KoiPondPalette): KoiPondColors {
  if (palette === "light" || palette === "dark") return PALETTES[palette];
  return { ...PALETTES[palette.base ?? "light"], ...palette };
}

const SLOPES = ["-", "\\", "|", "/"];
/** A line glyph for an angle: -, \, | or /. */
const slope = (angle: number) => SLOPES[((Math.round(((angle % Math.PI) + Math.PI) / (Math.PI / 4)) % 4) + 4) % 4];

/**
 * An ASCII koi pond: koi made of glyph-stamped grid cells (pale scales, orange and red patches, dark
 * markings) swim with a follow-the-leader spine, leave line-glyph wakes and pass under drifting lily
 * pads. They drift toward the cursor, scatter from fast moves, and race for food dropped with a click.
 * Rendered on a 2D canvas; pauses offscreen and in hidden tabs, and draws one still frame under reduced
 * motion.
 */
export function AsciiKoiPond({
  children,
  koi: koiCount = 5,
  cell = 14,
  palette = "light",
  lilyPads = 3,
  interactive = true,
  showCounter = true,
  onFeed,
  paused = false,
  className,
  style,
  ...props
}: AsciiKoiPondProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fed, setFed] = useState(0);
  const colors = resolvePalette(palette);
  const live = useRef({ paused, interactive, onFeed, colors });
  useEffect(() => {
    live.current = { paused, interactive, onFeed, colors };
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
    let last = performance.now();
    let time = 0;
    let total = 0;
    const fish: Koi[] = [];
    const pads: Pad[] = [];
    const food: { x: number; y: number; t: number }[] = [];
    const ripples: { x: number; y: number; t: number }[] = [];
    const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, inside: false, t: 0 };
    const count = Math.max(1, Math.min(12, Math.round(koiCount)));
    // Occupancy for one frame: which koi body cell (if any) covers each grid cell.
    let cols = 0;
    let rows = 0;

    const spawn = (i: number): Koi => {
      const seed = 1000 + i * 97;
      const length = cell * (15 + hash(i, 1) * 7);
      const x = width * (0.15 + hash(i, 2) * 0.7);
      const y = height * (0.15 + hash(i, 3) * 0.7);
      const heading = hash(i, 4) * Math.PI * 2;
      const step = length / SEGMENTS;
      return {
        spine: Array.from({ length: SEGMENTS + 1 }, (_, k) => ({ x: x - Math.cos(heading) * step * k, y: y - Math.sin(heading) * step * k })),
        heading,
        speed: 22 + hash(i, 5) * 16,
        length,
        width: length * (0.27 + hash(i, 6) * 0.05),
        seed,
        variety: VARIETIES[Math.floor(hash(i, 7) * VARIETIES.length)],
        phase: hash(i, 8) * 10,
        wander: hash(i, 9) * Math.PI * 2,
        wake: [],
      };
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      cols = Math.ceil(width / cell);
      rows = Math.ceil(height / cell);
      if (!fish.length) for (let i = 0; i < count; i++) fish.push(spawn(i));
      if (!pads.length) {
        for (let i = 0; i < lilyPads; i++) {
          pads.push({ x: width * (0.1 + hash(i, 21) * 0.8), y: height * (0.1 + hash(i, 22) * 0.8), r: cell * (3 + hash(i, 23) * 2.5), vx: (hash(i, 24) - 0.5) * 4, vy: (hash(i, 25) - 0.5) * 3, spin: hash(i, 26) * 6, notch: hash(i, 27) * Math.PI * 2 });
        }
      }
      draw();
    };

    const steer = (k: Koi, dt: number) => {
      const head = k.spine[0];
      let target = k.heading;
      let urgency = 1.2;
      let speed = k.speed;
      // Wander.
      k.wander += (noise(time * 0.15, k.seed * 0.01, k.seed) - 0.5) * dt * 3;
      target = k.wander;
      // Food first, then a curious drift toward the cursor.
      const pellet = food.reduce<{ f: (typeof food)[number]; d: number } | null>((best, f) => {
        const d = Math.hypot(f.x - head.x, f.y - head.y);
        return !best || d < best.d ? { f, d } : best;
      }, null);
      if (pellet && pellet.d < Math.max(width, height)) {
        target = Math.atan2(pellet.f.y - head.y, pellet.f.x - head.x);
        urgency = 3.2;
        speed = k.speed * 2.1;
        if (pellet.d < k.width * 0.6) {
          food.splice(food.indexOf(pellet.f), 1);
          total += 1;
          ripples.push({ x: pellet.f.x, y: pellet.f.y, t: time });
          setFed(total);
          live.current.onFeed?.(total);
        }
      } else if (pointer.inside && live.current.interactive) {
        const d = Math.hypot(pointer.x - head.x, pointer.y - head.y);
        const fast = Math.hypot(pointer.vx, pointer.vy) > 900 && time - pointer.t < 0.15;
        if (fast && d < k.length * 1.6) {
          // Startled: dart away.
          target = Math.atan2(head.y - pointer.y, head.x - pointer.x);
          urgency = 5;
          speed = k.speed * 3;
        } else if (d < Math.max(width, height) * 0.45 && d > k.length * 0.5) {
          target = Math.atan2(pointer.y - head.y, pointer.x - head.x) + Math.sin(time * 0.7 + k.phase) * 0.6;
          urgency = 1.6;
        }
      }
      // Keep a little apart from the others.
      for (const o of fish) {
        if (o === k) continue;
        const dx = head.x - o.spine[0].x;
        const dy = head.y - o.spine[0].y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < k.width * 2.2) target = Math.atan2(Math.sin(target) + (dy / d) * 0.8, Math.cos(target) + (dx / d) * 0.8);
      }
      // Turn back from the edges.
      const margin = k.length * 0.6;
      if (head.x < -margin * 0.4 || head.x > width + margin * 0.4 || head.y < -margin * 0.4 || head.y > height + margin * 0.4) {
        target = Math.atan2(height / 2 - head.y, width / 2 - head.x);
        urgency = 2.4;
      }
      let delta = target - k.heading;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      k.heading += Math.max(-1, Math.min(1, delta)) * urgency * dt;
      k.wander = k.heading + Math.atan2(Math.sin(k.wander - k.heading), Math.cos(k.wander - k.heading)) * 0.98;
      const v = speed * (0.85 + Math.sin(time * 2 + k.phase) * 0.15);
      head.x += Math.cos(k.heading) * v * dt;
      head.y += Math.sin(k.heading) * v * dt;
      // Follow the leader: each point trails the one before it at a fixed spacing.
      const step = k.length / SEGMENTS;
      for (let s = 1; s < k.spine.length; s++) {
        const a = k.spine[s - 1];
        const b = k.spine[s];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        b.x = a.x + (dx / d) * step;
        b.y = a.y + (dy / d) * step;
      }
      // Wake: points shed from the tail, fading out.
      const tail = k.spine[k.spine.length - 1];
      const lastWake = k.wake[k.wake.length - 1];
      if (!lastWake || Math.hypot(lastWake.x - tail.x, lastWake.y - tail.y) > cell * 0.9) {
        const b = k.spine[k.spine.length - 3];
        k.wake.push({ x: tail.x, y: tail.y, a: Math.atan2(tail.y - b.y, tail.x - b.x), t: time });
      }
      while (k.wake.length && time - k.wake[0].t > 2.6) k.wake.shift();
    };

    const draw = () => {
      const c = live.current.colors;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = c.background;
      ctx.fillRect(0, 0, width, height);
      const family = getComputedStyle(root).getPropertyValue("--koi-font").trim() || "ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.font = `600 ${Math.round(cell * 0.72)}px ${family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const glyph = (gx: number, gy: number, ch: string, color: string, alpha = 1) => {
        if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) return;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillText(ch, gx * cell + cell / 2, gy * cell + cell / 2 + 0.5);
      };

      // Lily pads: outlines made of slope glyphs, with a notch.
      for (const p of pads) {
        const steps = Math.ceil((p.r * 2 * Math.PI) / cell);
        const seen = new Set<number>();
        for (let s = 0; s < steps; s++) {
          const a = (s / steps) * Math.PI * 2;
          const rel = Math.atan2(Math.sin(a - p.notch - p.spin), Math.cos(a - p.notch - p.spin));
          if (Math.abs(rel) < 0.32) continue;
          const gx = Math.floor((p.x + Math.cos(a) * p.r) / cell);
          const gy = Math.floor((p.y + Math.sin(a) * p.r) / cell);
          const key = gy * 10000 + gx;
          if (seen.has(key)) continue;
          seen.add(key);
          glyph(gx, gy, slope(a + Math.PI / 2), c.line, 0.75);
        }
        // The notch's two edges, pointing at the center.
        for (const side of [-0.32, 0.32]) {
          const a = p.notch + p.spin + side;
          for (let r = cell; r < p.r; r += cell) glyph(Math.floor((p.x + Math.cos(a) * r) / cell), Math.floor((p.y + Math.sin(a) * r) / cell), slope(a), c.line, 0.55);
        }
      }

      // Ripples from food and feeding: rings of dots that fade as they grow.
      for (const r of ripples) {
        const age = time - r.t;
        const radius = 8 + age * 90;
        const steps = Math.ceil((radius * 2 * Math.PI) / cell);
        for (let s = 0; s < steps; s++) {
          const a = (s / steps) * Math.PI * 2;
          glyph(Math.floor((r.x + Math.cos(a) * radius) / cell), Math.floor((r.y + Math.sin(a) * radius) / cell), age < 0.4 ? "o" : ".", c.line, Math.max(0, 1 - age / 1.6));
        }
      }

      // Wakes: two diverging lines of slope glyphs behind each tail.
      for (const k of fish) {
        for (const w of k.wake) {
          const age = time - w.t;
          const spread = k.width * 0.3 + age * cell * 1.6;
          for (const side of [-1, 1]) {
            const nx = Math.cos(w.a + (Math.PI / 2) * side);
            const ny = Math.sin(w.a + (Math.PI / 2) * side);
            glyph(Math.floor((w.x + nx * spread) / cell), Math.floor((w.y + ny * spread) / cell), slope(w.a + side * 0.6), c.line, Math.max(0, 0.8 - age / 3));
          }
        }
      }

      // Food pellets.
      for (const f of food) glyph(Math.floor(f.x / cell), Math.floor(f.y / cell), "*", c.patchDeep, 1);

      // Koi: rasterize each body into cells. Later koi swim over earlier ones.
      ctx.globalAlpha = 1;
      for (const k of fish) {
        const xs = k.spine.map((p) => p.x);
        const ys = k.spine.map((p) => p.y);
        const pad = k.width;
        const gx0 = Math.max(0, Math.floor((Math.min(...xs) - pad) / cell));
        const gx1 = Math.min(cols - 1, Math.floor((Math.max(...xs) + pad) / cell));
        const gy0 = Math.max(0, Math.floor((Math.min(...ys) - pad) / cell));
        const gy1 = Math.min(rows - 1, Math.floor((Math.max(...ys) + pad) / cell));
        const swim = time * 7 + k.phase;
        // Lateral sway, growing toward the tail.
        const sway = (t: number) => Math.sin(swim - t * 5) * k.width * 0.22 * t * t;
        const dir = { x: Math.cos(k.heading), y: Math.sin(k.heading) };
        const eyes = [-1, 1].map((side) => {
          const p = k.spine[1];
          return { gx: Math.floor((p.x - dir.y * side * k.width * 0.24) / cell), gy: Math.floor((p.y + dir.x * side * k.width * 0.24) / cell) };
        });
        for (let gy = gy0; gy <= gy1; gy++) {
          for (let gx = gx0; gx <= gx1; gx++) {
            const px = gx * cell + cell / 2;
            const py = gy * cell + cell / 2;
            // Nearest spine segment.
            let best = Infinity;
            let bestT = 0;
            let bestSide = 0;
            for (let s = 0; s < SEGMENTS; s++) {
              const a = k.spine[s];
              const b = k.spine[s + 1];
              const abx = b.x - a.x;
              const aby = b.y - a.y;
              const len2 = abx * abx + aby * aby || 1;
              const u = Math.max(0, Math.min(1, ((px - a.x) * abx + (py - a.y) * aby) / len2));
              const t = (s + u) / SEGMENTS;
              const nx = -aby / Math.sqrt(len2);
              const ny = abx / Math.sqrt(len2);
              const cx = a.x + abx * u + nx * sway(t);
              const cy = a.y + aby * u + ny * sway(t);
              const d = Math.hypot(px - cx, py - cy);
              if (d < best) {
                best = d;
                bestT = t;
                bestSide = (px - cx) * nx + (py - cy) * ny;
              }
            }
            const half = (profile(bestT) * k.width) / 2;
            // Pectoral fins: small flaps just behind the head.
            const fin = bestT > 0.2 && bestT < 0.34 && best < half + cell * 1.1 && best >= half;
            if (best >= half && !fin) continue;
            const side = Math.max(-1, Math.min(1, bestSide / Math.max(1, half)));
            const n = noise(bestT * 7, side * 1.8 + 10, k.seed);
            const m = noise(bestT * 9 + 40, side * 2.2, k.seed + 7);
            let fill = c.body;
            let ink = c.bodyInk;
            let ch = BODY_GLYPHS[Math.floor(hash(Math.round(bestT * 30), Math.round(side * 3), k.seed) * BODY_GLYPHS.length)];
            const edge = best > half - cell * 0.5 && bestT > 0.05;
            if (fin || bestT > 0.86) {
              // Fins and tail: pale, with a stroke glyph along the fin rays.
              ctx.globalAlpha = 0.55;
              ctx.fillStyle = c.body;
              ctx.fillRect(gx * cell + 1, gy * cell + 1, cell - 2, cell - 2);
              glyph(gx, gy, slope(k.heading + (side > 0 ? 0.8 : -0.8)), c.bodyInk, 0.9);
              continue;
            }
            if (k.variety.sumi > 0 && m < k.variety.sumi + 0.15 && bestT > 0.1) {
              fill = c.dark;
              ink = c.bodyInk;
              ch = "#";
            } else if (n < k.variety.patch && bestT > 0.04 && bestT < 0.84) {
              fill = noise(bestT * 4, side + 3, k.seed + 3) < k.variety.deep ? c.patchDeep : c.patch;
              ink = c.patchInk;
              ch = PATCH_GLYPHS[Math.floor(hash(Math.round(bestT * 30), Math.round(side * 3), k.seed + 1) * PATCH_GLYPHS.length)];
            }
            ctx.globalAlpha = edge ? 0.75 : 1;
            ctx.fillStyle = fill;
            ctx.fillRect(gx * cell + 1, gy * cell + 1, cell - 2, cell - 2);
            glyph(gx, gy, ch, ink, edge ? 0.7 : 0.95);
          }
        }
        for (const e of eyes) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = c.background;
          ctx.fillRect(e.gx * cell + 1, e.gy * cell + 1, cell - 2, cell - 2);
          glyph(e.gx, e.gy, "o", c.eye, 1);
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!live.current.paused) {
        time += dt;
        for (const k of fish) steer(k, dt);
        for (const p of pads) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.spin += dt * 0.05;
          if (p.x < -p.r) p.x = width + p.r;
          if (p.x > width + p.r) p.x = -p.r;
          if (p.y < -p.r) p.y = height + p.r;
          if (p.y > height + p.r) p.y = -p.r;
        }
        while (ripples.length && time - ripples[0].t > 1.6) ripples.shift();
        for (let i = food.length - 1; i >= 0; i--) if (time - food[i].t > 12) food.splice(i, 1);
        draw();
      }
      schedule();
    };
    const schedule = () => {
      if (!frame && visible && !document.hidden && !reduceMotion) frame = requestAnimationFrame(tick);
    };

    const local = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const p = local(e);
      const now = performance.now() / 1000;
      const dt = Math.max(0.008, now - pointer.t);
      pointer.vx = (p.x - pointer.x) / dt;
      pointer.vy = (p.y - pointer.y) / dt;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.t = time;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    const onDown = (e: PointerEvent) => {
      if (!live.current.interactive || reduceMotion) return;
      // Clicks on content (links, buttons, fields) are theirs, not food.
      if ((e.target as HTMLElement).closest("a, button, input, textarea, select, label, [role=button]")) return;
      const p = local(e);
      for (let i = 0; i < 3; i++) food.push({ x: p.x + (hash(food.length + i, total, 3) - 0.5) * cell * 2, y: p.y + (hash(food.length + i, total, 4) - 0.5) * cell * 2, t: time });
      ripples.push({ x: p.x, y: p.y, t: time });
      if (food.length > 24) food.splice(0, food.length - 24);
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
    root.addEventListener("pointerdown", onDown);
    resize();
    // A web font that arrives late would draw as a fallback, so repaint once fonts settle.
    document.fonts?.ready.then(() => draw());
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
    };
  }, [koiCount, cell, lilyPads]);

  return (
    <div
      ref={rootRef}
      className={cn("relative isolate overflow-hidden font-mono [--koi-font:var(--font-geist-mono,ui-monospace)]", className)}
      style={{ background: colors.background, ...style }}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />
      {showCounter ? (
        <span aria-hidden="true" className="pointer-events-none absolute top-3 right-4 font-mono text-[11px] tabular-nums" style={{ color: colors.bodyInk }}>
          fed {fed}
        </span>
      ) : null}
      {children}
    </div>
  );
}
