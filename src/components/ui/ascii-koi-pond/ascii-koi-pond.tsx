"use client";

/*
 * The rendering here (top-down bodies, shaded blocks under density-matched glyphs, sub-sampled
 * edges, a wake field that lights the water) learns from ascii-sharks by drewdi,
 * https://github.com/stackedlol/ascii-sharks (MIT). This is an independent implementation.
 */

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { runCanvasLoop, type CanvasLoop } from "@/lib/glyph/canvas-loop";
import { getGlyphAtlas, loadGlyphFont, monoFontFamily, resolveCanvasColors, type GlyphAtlas } from "@/lib/glyph/glyph-atlas";
import { CellBuffer, cellAt, cellGrid, followSpine, hash3, mix3, nearestOnSpine, parseColor, straightSpine, SUBSAMPLES, WakeField, waveSpine, type CellGrid, type SpineHit } from "@/lib/glyph/ascii-life";

export interface KoiPondColors {
  /** Water behind everything. */
  background: string;
  /** Body (the pale scales). */
  body: string;
  /** Glyphs on pale scales. */
  bodyInk: string;
  /** Bright pattern patches (orange). */
  patch: string;
  /** Deep pattern patches (red). */
  patchDeep: string;
  /** Glyphs on patches. */
  patchInk: string;
  /** Dark markings (sumi). */
  dark: string;
  /** Eyes. */
  eye: string;
  /** Wakes, ripples, lily pad outlines and the faint grid. */
  line: string;
}

export type KoiPondPalette = "light" | "dark" | (Partial<KoiPondColors> & { base?: "light" | "dark" });

export interface AsciiKoiPondProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content above the pond, e.g. a hero. */
  children?: ReactNode;
  /** How many koi swim in the pond (1–12). @default 5 */
  koi?: number;
  /** Cell width in px; cells are about 1.45 times as tall and glyphs scale with them. @default 8 */
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
    body: "#ece9e1",
    bodyInk: "#6f6a5f",
    patch: "#ef8b3c",
    patchDeep: "#d2452a",
    patchInk: "#5e1f0c",
    dark: "#34322f",
    eye: "#f7f6f2",
    line: "#b4ae9f",
  },
  dark: {
    background: "#11100f",
    body: "#b9b5ad",
    bodyInk: "#2a2825",
    patch: "#d97b2f",
    patchDeep: "#b33a20",
    patchInk: "#2a0e05",
    dark: "#23211f",
    eye: "#ece9e2",
    line: "#4a4743",
  },
};

/** Koi varieties: how much of the body carries pattern, and which patch colors. */
const VARIETIES = [
  { patch: 0.4, deep: 0.5, sumi: 0 }, // kohaku-like: white with red-orange
  { patch: 0.34, deep: 0.25, sumi: 0.12 }, // showa-like: with black markings
  { patch: 0.6, deep: 0.15, sumi: 0 }, // mostly orange
  { patch: 0.28, deep: 0.8, sumi: 0.04 }, // pale with deep red
] as const;

const SEGMENTS = 16;
const SHADES = 10;
const GLYPHS = [..." .'`,:;-=+*o%#@\\|/~"];
const G = Object.fromEntries(GLYPHS.map((g, i) => [g, i])) as Record<string, number>;
/** Sparse glyphs on lit scales (none on the brightest), dense ones in shadow. */
const RAMP = [255, G["."], G[":"], G[";"], G["+"], G["*"], G["%"], G["#"], G["@"]];
const SLOPE = [G["-"], G["\\"], G["|"], G["/"]];
/** Atlas color slots. */
const C = { bodyInk: 0, patchInk: 1, line: 2, eye: 3, food: 4, sumiInk: 5, fin: 6 } as const;

interface Koi {
  /** Spine points, head first: [x0, y0, x1, y1, …]. */
  nodes: Float32Array;
  heading: number;
  speed: number;
  length: number;
  width: number;
  seed: number;
  variety: (typeof VARIETIES)[number];
  phase: number;
  wander: number;
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

const hash = (a: number, b: number, c = 0) => hash3(a, b, c);

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

/** Body half-width along the spine (0 head → 1 tail tip), as a share of the full width. */
function profile(t: number) {
  if (t < 0.1) return 0.5 + Math.sin((t / 0.1) * Math.PI * 0.5) * 0.4;
  if (t < 0.32) return 0.9 + Math.sin(((t - 0.1) / 0.22) * Math.PI * 0.5) * 0.1;
  if (t < 0.8) return 1 - ((t - 0.32) / 0.48) ** 1.3 * 0.84;
  return 0.16;
}

function resolvePalette(palette: KoiPondPalette): KoiPondColors {
  if (palette === "light" || palette === "dark") return PALETTES[palette];
  return { ...PALETTES[palette.base ?? "light"], ...palette };
}

/** A line glyph for an angle: -, \, | or /. */
const slope = (angle: number) => SLOPE[((Math.round(((angle % Math.PI) + Math.PI) / (Math.PI / 4)) % 4) + 4) % 4];

/**
 * An ASCII koi pond seen from above. Each koi is a follow-the-leader spine with a swaying tail,
 * drawn as shaded blocks (pale scales, orange and red patches, dark markings) under glyphs that
 * thicken into shadow, with soft supersampled edges, fanned fins and eyes. Koi drift toward the
 * cursor, scatter from fast moves and race for food dropped with a click; their wakes light the
 * water and fade, and lily pads drift past as outlines. Glyphs come from a shared atlas; the canvas
 * pauses offscreen and in hidden tabs and draws one still frame under reduced motion.
 */
export function AsciiKoiPond({
  children,
  koi: koiCount = 5,
  cell = 8,
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
  const colorKey = JSON.stringify(colors);
  const live = useRef({ paused, interactive, onFeed, loop: null as CanvasLoop | null });
  useEffect(() => {
    live.current.paused = paused;
    live.current.interactive = interactive;
    live.current.onFeed = onFeed;
    live.current.loop?.wake();
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const state = live.current;
    const pal: KoiPondColors = JSON.parse(colorKey);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fontFamily = monoFontFamily(root);
    const rgb = (c: string) => parseColor(resolveCanvasColors([c], root)[0]);
    const [bgRgb, lineRgb] = [rgb(pal.background), rgb(pal.line)];
    // Fins are drawn in whichever of body or body ink stands out more from the water.
    const [bodyRgb, bodyInkRgb] = [rgb(pal.body), rgb(pal.bodyInk)];
    const contrast = (c: readonly number[]) => Math.abs(c[0] + c[1] + c[2] - bgRgb[0] - bgRgb[1] - bgRgb[2]);
    const finInk = mix3(contrast(bodyRgb) > contrast(bodyInkRgb) ? bodyRgb : bodyInkRgb, bgRgb, 0.15);
    const atlasColors = resolveCanvasColors([pal.bodyInk, pal.patchInk, pal.line, pal.eye, pal.patchDeep, pal.body, finInk], root);

    // Shaded block ramps per pattern layer: from a shadowed tone to a sunlit one.
    const blockStyles = [""];
    for (const base of [pal.body, pal.patch, pal.patchDeep, pal.dark]) {
      const c = rgb(base);
      const shadow = c.map((v) => v * 0.62);
      const lit = c.map((v) => v + (255 - v) * 0.22);
      for (let l = 0; l < SHADES; l++) blockStyles.push(mix3(shadow, lit, l / (SHADES - 1)));
    }
    const padStyle = blockStyles.length;
    blockStyles.push(mix3(lineRgb, bgRgb, 0.84));
    const blockIndex = (layer: number, shade: number) => 1 + layer * SHADES + Math.min(SHADES - 1, Math.max(0, Math.round(shade * (SHADES - 1))));
    const wakeStyles = [0.35, 0.5, 0.65, 0.8, 0.95].map((a) => `rgba(${lineRgb.join(",")},${a})`);

    let grid: CellGrid = cellGrid(1, 1, cell);
    let width = 1;
    let height = 1;
    let dpr = 1;
    let atlas: GlyphAtlas | null = null;
    let wake = new WakeField(1, 1);
    let cells = new CellBuffer(1);
    let background: HTMLCanvasElement | null = null;
    let disposed = false;
    let time = 0;
    let total = 0;
    const fish: Koi[] = [];
    const pads: Pad[] = [];
    const food: { x: number; y: number; t: number }[] = [];
    const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, inside: false, t: 0, stamp: 0 };
    const count = Math.max(1, Math.min(12, Math.round(koiCount)));
    const hit: SpineHit = { s: 0, v: 0, dist: 0, nx: 0, ny: 0 };
    const spine = new Float32Array((SEGMENTS + 1) * 2);
    const arc = new Float32Array(SEGMENTS + 1);

    const buildAtlas = () => {
      atlas = getGlyphAtlas({ glyphs: GLYPHS, colors: atlasColors, cell: grid.ch, dpr, fontFamily, fontWeight: 600, fontScale: 0.74 });
    };

    const paintBackground = () => {
      background ??= document.createElement("canvas");
      background.width = Math.round(width * dpr);
      background.height = Math.round(height * dpr);
      const g = background.getContext("2d");
      if (!g) return;
      g.fillStyle = `rgb(${bgRgb.join(",")})`;
      g.fillRect(0, 0, background.width, background.height);
      g.strokeStyle = `rgba(${lineRgb.join(",")},0.16)`;
      g.lineWidth = 1;
      g.beginPath();
      for (let c = 0; c <= grid.cols; c++) {
        const x = Math.round(c * grid.cw * dpr) + 0.5;
        g.moveTo(x, 0);
        g.lineTo(x, background.height);
      }
      for (let r = 0; r <= grid.rows; r++) {
        const y = Math.round(r * grid.ch * dpr) + 0.5;
        g.moveTo(0, y);
        g.lineTo(background.width, y);
      }
      g.stroke();
    };

    const spawn = (i: number): Koi => {
      // At least ~24 cells long so the shading has room, whatever the cell size.
      const length = Math.max(grid.cw * 24, Math.min(Math.max(300, grid.cw * 32), Math.min(width, height) * 0.44)) * (0.8 + hash(i, 1) * 0.35);
      const x = width * (0.15 + hash(i, 2) * 0.7);
      const y = height * (0.15 + hash(i, 3) * 0.7);
      const heading = hash(i, 4) * Math.PI * 2;
      return {
        nodes: straightSpine(SEGMENTS + 1, x, y, heading, length),
        heading,
        speed: 24 + hash(i, 5) * 16,
        length,
        width: length * (0.22 + hash(i, 6) * 0.04),
        seed: 1000 + i * 97,
        variety: VARIETIES[Math.floor(hash(i, 7) * VARIETIES.length)],
        phase: hash(i, 8) * 10,
        wander: hash(i, 9) * Math.PI * 2,
      };
    };

    /* ---------------------------------------------------------- simulation */

    const steer = (k: Koi, dt: number) => {
      const hx = k.nodes[0];
      const hy = k.nodes[1];
      let urgency = 1.2;
      let speed = k.speed;
      k.wander += (noise(time * 0.15, k.seed * 0.01, k.seed) - 0.5) * dt * 3;
      let target = k.wander;
      // Food first, then a curious drift toward the cursor.
      let pellet: (typeof food)[number] | null = null;
      let best = Infinity;
      for (const f of food) {
        const d = Math.hypot(f.x - hx, f.y - hy);
        if (d < best) {
          best = d;
          pellet = f;
        }
      }
      if (pellet && best < Math.max(width, height)) {
        target = Math.atan2(pellet.y - hy, pellet.x - hx);
        urgency = 3.2;
        speed = k.speed * 2.1;
        if (best < k.width * 0.6) {
          food.splice(food.indexOf(pellet), 1);
          total += 1;
          wake.ring(grid, pellet.x, pellet.y, grid.cw * 2, 1.1);
          setFed(total);
          state.onFeed?.(total);
        }
      } else if (pointer.inside && state.interactive) {
        const d = Math.hypot(pointer.x - hx, pointer.y - hy);
        const fast = Math.hypot(pointer.vx, pointer.vy) > 900 && time - pointer.t < 0.15;
        if (fast && d < k.length * 1.6) {
          // Startled: dart away.
          target = Math.atan2(hy - pointer.y, hx - pointer.x);
          urgency = 5;
          speed = k.speed * 3;
        } else if (d < Math.max(width, height) * 0.45 && d > k.length * 0.5) {
          target = Math.atan2(pointer.y - hy, pointer.x - hx) + Math.sin(time * 0.7 + k.phase) * 0.6;
          urgency = 1.6;
        }
      }
      // Keep a little apart from the others.
      for (const o of fish) {
        if (o === k) continue;
        const dx = hx - o.nodes[0];
        const dy = hy - o.nodes[1];
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < k.width * 2.2) target = Math.atan2(Math.sin(target) + (dy / d) * 0.8, Math.cos(target) + (dx / d) * 0.8);
      }
      // Turn back from the edges.
      const margin = k.length * 0.6;
      if (hx < -margin * 0.4 || hx > width + margin * 0.4 || hy < -margin * 0.4 || hy > height + margin * 0.4) {
        target = Math.atan2(height / 2 - hy, width / 2 - hx);
        urgency = 2.4;
      }
      let delta = target - k.heading;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      const v = speed * (0.85 + Math.sin(time * 2 + k.phase) * 0.15);
      // Turn no tighter than a circle about a third of the body long, so koi glide in arcs.
      const maxTurn = v / (k.length * (urgency > 3 ? 0.22 : 0.34));
      k.heading += Math.max(-maxTurn, Math.min(maxTurn, delta * urgency)) * dt;
      k.wander = k.heading + Math.atan2(Math.sin(k.wander - k.heading), Math.cos(k.wander - k.heading)) * 0.98;
      k.nodes[0] += Math.cos(k.heading) * v * dt;
      k.nodes[1] += Math.sin(k.heading) * v * dt;
      followSpine(k.nodes, k.heading, k.length / SEGMENTS, 0.13);
      // The tail sweeps the water.
      for (let s = SEGMENTS - 5; s <= SEGMENTS; s++) wake.add(cellAt(grid, k.nodes[s * 2], k.nodes[s * 2 + 1]), 0.05 + v * 0.0016);
    };

    const step = (dt: number) => {
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
      for (let i = food.length - 1; i >= 0; i--) if (time - food[i].t > 12) food.splice(i, 1);
      if (pointer.inside && state.interactive) wake.stamp(grid, pointer.x, pointer.y, 1, 0.05);
      wake.step(dt, 1.2);
    };

    /* ---------------------------------------------------------- drawing */

    const shadeOut = { shade: 0 };

    /** Classifies a point against the loaded spine: 0 miss, 1 body, 2 fin or tail, 3 dorsal ridge. */
    const sample = (k: Koi, totalLen: number, px: number, py: number) => {
      nearestOnSpine(spine, arc, totalLen, px, py, hit);
      const t = hit.s;
      const half = (profile(t) * k.width) / 2;
      if (hit.dist <= half && t < 0.8) {
        const across = hit.dist / (half || 1);
        // A rounded back lit from the top left.
        const facing = (hit.nx * -0.6 + hit.ny * -0.8) * across;
        shadeOut.shade = 0.68 - across * across * 0.44 + facing * 0.26;
        // The dorsal fin runs down the middle of the back as a thin bright ridge.
        return t > 0.3 && t < 0.62 && hit.dist < k.width * 0.07 ? 3 : 1;
      }
      // Pectoral fins sweep back from behind the head, small pelvic fins further down.
      const pec = (t - 0.17) / 0.17;
      const pel = (t - 0.5) / 0.08;
      const fin =
        (pec > 0 && pec < 1 && hit.dist < half + k.width * 0.36 * Math.sin(pec * Math.PI) * (1 - pec * 0.4)) ||
        (pel > 0 && pel < 1 && hit.dist < half + k.width * 0.14 * Math.sin(pel * Math.PI));
      // The tail fans out into a shallow fork; nothing past its tip.
      const fan = (t - 0.8) / 0.2;
      const tail = fan > 0 && t < 0.998 && hit.dist < k.width * (0.08 + 0.42 * fan) && !(fan > 0.72 && hit.dist < k.width * 0.5 * (fan - 0.72));
      if (fin || tail) {
        shadeOut.shade = 0.5;
        return 2;
      }
      return 0;
    };

    const drawKoi = (k: Koi, order: number) => {
      const totalLen = waveSpine(k.nodes, spine, arc, time * 6 + k.phase, k.width * 0.2, 3.2);
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let s = 0; s <= SEGMENTS; s++) {
        minX = Math.min(minX, spine[s * 2]);
        maxX = Math.max(maxX, spine[s * 2]);
        minY = Math.min(minY, spine[s * 2 + 1]);
        maxY = Math.max(maxY, spine[s * 2 + 1]);
      }
      const pad = k.width;
      const c0 = Math.max(0, Math.floor((minX - pad) / grid.cw));
      const c1 = Math.min(grid.cols - 1, Math.floor((maxX + pad) / grid.cw));
      const r0 = Math.max(0, Math.floor((minY - pad) / grid.ch));
      const r1 = Math.min(grid.rows - 1, Math.floor((maxY + pad) / grid.ch));
      const depth = 1 + order * 0.01;
      // Eyes: the cells on either side of the head.
      const ex = spine[2];
      const ey = spine[3];
      const dirX = spine[0] - spine[4];
      const dirY = spine[1] - spine[5];
      const dl = Math.hypot(dirX, dirY) || 1;
      const eyes = [-1, 1].map((side) => cellAt(grid, ex - (dirY / dl) * side * k.width * 0.24, ey + (dirX / dl) * side * k.width * 0.24));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const x = c * grid.cw;
          const y = r * grid.ch;
          const flag = sample(k, totalLen, x + grid.cw / 2, y + grid.ch / 2);
          if (!flag && hit.dist > pad) continue;
          const shade = shadeOut.shade;
          const t = hit.s;
          const side = Math.max(-1, Math.min(1, hit.v / Math.max(1, (profile(t) * k.width) / 2)));
          // Fin rays fan out from the body and sweep back toward the tail.
          const normal = Math.atan2(hit.ny, hit.nx);
          const rayAngle = normal + (t >= 0.8 ? -Math.sign(hit.v) * 1.2 : Math.sign(hit.v) * 0.7);
          let hits = flag ? 1 : 0;
          for (let s = 0; s < SUBSAMPLES.length; s += 2) if (sample(k, totalLen, x + SUBSAMPLES[s] * grid.cw, y + SUBSAMPLES[s + 1] * grid.ch)) hits++;
          if (!hits) continue;
          const i = r * grid.cols + c;
          const key = (hash(Math.round(t * 40), Math.round(side * 4), k.seed) * 4294967295) >>> 0;
          if (eyes.includes(i)) {
            cells.set(i, depth + 0.5, blockIndex(3, 0.1), G.o, C.eye);
            continue;
          }
          if (flag === 2) {
            // Fins and tail: translucent, just their rays over the water.
            cells.set(i, depth - 0.2, 0, slope(rayAngle), C.fin, hits >= 4 ? 230 : 130);
            continue;
          }
          if (flag === 3 && hits >= 3) {
            cells.set(i, depth, blockIndex(0, 0.95), slope(normal + Math.PI / 2), C.bodyInk, 170);
            continue;
          }
          if (!flag || hits < 3) {
            // Soft edge: a light glyph, no block.
            cells.set(i, depth - 0.5, 0, [G["."], G["'"], G[","], G["`"], G[":"]][(key >>> 8) % 5], C.bodyInk, Math.round((0.35 + hits * 0.12) * 255));
            continue;
          }
          // Pattern in body coordinates, so markings travel with the fish.
          const n = noise(t * 7, side * 1.8 + 10, k.seed);
          const m = noise(t * 9 + 40, side * 2.2, k.seed + 7);
          let layer = 0;
          let ink: number = C.bodyInk;
          if (k.variety.sumi > 0 && m < k.variety.sumi + 0.15 && t > 0.1) {
            layer = 3;
            ink = C.sumiInk;
          } else if (n < k.variety.patch && t > 0.04 && t < 0.84) {
            layer = noise(t * 4, side + 3, k.seed + 3) < k.variety.deep ? 2 : 1;
            ink = C.patchInk;
          }
          const glyph = RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.floor((1 - shade) ** 1.25 * (RAMP.length - 0.01)) + (((key >>> 4) % 3) - 1)))];
          cells.set(i, depth, blockIndex(layer, shade), glyph, ink, 200);
        }
      }
    };

    const drawPads = () => {
      for (const p of pads) {
        const c0 = Math.max(0, Math.floor((p.x - p.r) / grid.cw));
        const c1 = Math.min(grid.cols - 1, Math.floor((p.x + p.r) / grid.cw));
        const r0 = Math.max(0, Math.floor((p.y - p.r) / grid.ch));
        const r1 = Math.min(grid.rows - 1, Math.floor((p.y + p.r) / grid.ch));
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const dx = (c + 0.5) * grid.cw - p.x;
            const dy = ((r + 0.5) * grid.ch - p.y) / 0.9;
            const d = Math.hypot(dx, dy) / p.r;
            if (d > 1) continue;
            // A wedge-shaped notch cut toward the center.
            const a = Math.atan2(dy, dx);
            const rel = Math.atan2(Math.sin(a - p.notch - p.spin), Math.cos(a - p.notch - p.spin));
            if (Math.abs(rel) < 0.3 && d > 0.12) continue;
            const i = r * grid.cols + c;
            if (d > 1 - grid.cw / p.r) cells.set(i, 0.3, padStyle, slope(a + Math.PI / 2), C.line, 230);
            else cells.set(i, 0.3, padStyle, hash(c, r, 5) < 0.12 ? slope(a) : 255, C.line, 120);
          }
        }
      }
    };

    const render = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (background) ctx.drawImage(background, 0, 0);
      if (!fish.length) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells.clear();
      drawPads();
      fish.forEach((k, order) => drawKoi(k, order));
      for (const f of food) cells.set(cellAt(grid, f.x, f.y), 0.4, 0, G["*"], C.food);
      // Wakes and ripples light the water.
      const e = wake.energy;
      const size = Math.max(2, Math.round(grid.cw * 0.3));
      for (let level = 0; level < wakeStyles.length; level++) {
        ctx.fillStyle = wakeStyles[level];
        for (let i = 0; i < e.length; i++) {
          if (e[i] < 0.16 || cells.depth[i] >= 0) continue;
          if (Math.min(wakeStyles.length - 1, Math.floor((e[i] - 0.16) * 5)) !== level) continue;
          ctx.fillRect(Math.round((i % grid.cols) * grid.cw + grid.cw * 0.6), Math.round(((i / grid.cols) | 0) * grid.ch + grid.ch * 0.6), size, size);
        }
      }
      cells.draw(ctx, grid, blockStyles, atlas);
    };

    const loop = runCanvasLoop({
      host: root,
      canvas,
      isPaused: () => state.paused,
      resize: (frame) => {
        width = frame.width;
        height = frame.height;
        dpr = frame.dpr;
        const next = cellGrid(width, height, Math.max(6, Math.round(cell)));
        if (next.cols !== grid.cols || next.rows !== grid.rows) {
          wake = new WakeField(next.cols, next.rows);
          cells = new CellBuffer(next.cols * next.rows);
        }
        grid = next;
        buildAtlas();
        paintBackground();
        if (!fish.length) for (let i = 0; i < count; i++) fish.push(spawn(i));
        if (!pads.length) {
          for (let i = 0; i < lilyPads; i++) {
            pads.push({
              x: width * (0.1 + hash(i, 21) * 0.8),
              y: height * (0.1 + hash(i, 22) * 0.8),
              r: grid.cw * (3.5 + hash(i, 23) * 2.5),
              vx: (hash(i, 24) - 0.5) * 4,
              vy: (hash(i, 25) - 0.5) * 3,
              spin: hash(i, 26) * 6,
              notch: hash(i, 27) * Math.PI * 2,
            });
          }
        }
        // Still frames show the koi mid-swim rather than in a straight line.
        if (frame.still && time === 0) for (let s = 0; s < 120; s++) step(1 / 60);
      },
      render: ({ dt }) => {
        if (dt > 0) step(dt);
        render();
      },
    });
    state.loop = loop;

    const local = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const p = local(e);
      const dt = Math.max(0.008, (e.timeStamp - pointer.stamp) / 1000);
      pointer.vx = (p.x - pointer.x) / dt;
      pointer.vy = (p.y - pointer.y) / dt;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.stamp = e.timeStamp;
      pointer.t = time;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    const onDown = (e: PointerEvent) => {
      if (!state.interactive || reduceMotion.matches || state.paused) return;
      // Clicks on content (links, buttons, fields) are theirs, not food.
      if ((e.target as HTMLElement).closest("a, button, input, textarea, select, label, [role=button]")) return;
      const p = local(e);
      for (let i = 0; i < 3; i++) food.push({ x: p.x + (hash(food.length + i, total, 3) - 0.5) * grid.cw * 2, y: p.y + (hash(food.length + i, total, 4) - 0.5) * grid.ch * 2, t: time });
      wake.ring(grid, p.x, p.y, grid.cw * 2.5, 1.2);
      if (food.length > 24) food.splice(0, food.length - 24);
      loop.wake();
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);

    loadGlyphFont({ glyphs: GLYPHS, fontFamily, fontWeight: 600 }).then(() => {
      if (disposed) return;
      buildAtlas();
      loop.redraw();
    });

    return () => {
      disposed = true;
      state.loop = null;
      loop.dispose();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
    };
  }, [koiCount, cell, lilyPads, colorKey]);

  return (
    <div ref={rootRef} className={cn("relative isolate overflow-hidden font-mono", className)} style={{ background: colors.background, ...style }} {...props}>
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
