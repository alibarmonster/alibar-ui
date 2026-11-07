"use client";

/*
 * ASCII Shark Sea learns its look and behavior from ascii-sharks by drewdi
 * (https://github.com/stackedlol/ascii-sharks): top-down shark outlines, shaded blocks under
 * density-matched glyphs, supersampled silhouettes, a diffusing wake field, and schools that
 * flock, spread alarm and break around hunting sharks. The code here is an independent
 * implementation; credit and the original license follow.
 *
 * MIT License
 *
 * Copyright (c) 2026 drewdi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { runCanvasLoop, type CanvasLoop } from "@/lib/glyph/canvas-loop";
import { getGlyphAtlas, loadGlyphFont, monoFontFamily, resolveCanvasColors, type GlyphAtlas } from "@/lib/glyph/glyph-atlas";
import { CellBuffer, cellAt, cellGrid, followSpine, hash3, mix3, nearestOnSpine, parseColor, straightSpine, SUBSAMPLES, WakeField, waveSpine, type CellGrid, type SpineHit } from "@/lib/glyph/ascii-life";

export type SharkKind = "hammerhead" | "great-white" | "reef" | "tiger" | "thresher";

export interface SharkSpec {
  /** Species: a hammer-shaped head, a heavy great white, a slim reef shark with dark fin tips, a barred tiger, or a thresher with a whip of a tail. */
  kind: SharkKind;
  /** Length relative to the biggest shark; smaller ones read as deeper and dimmer. @default 1 */
  size?: number;
}

export interface SharkSeaColors {
  /** Water. */
  background: string;
  /** The faint cell grid. */
  grid: string;
  /** Dots lit by the wake of anything swimming. */
  wake: string;
  /** Sunlit back of the sharks. */
  skinLight: string;
  /** Shadowed flanks. */
  skinDark: string;
  /** Glyphs on the skin. */
  ink: string;
  /** Glyphs along the soft silhouette edge. */
  edge: string;
  /** Fish. */
  fish: string;
  /** Bait and feeding sparks. */
  bait: string;
}

export type SharkSeaPalette = "light" | "dark" | (Partial<SharkSeaColors> & { base?: "light" | "dark" });

export interface AsciiSharkSeaProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content above the sea, e.g. a hero. Sharks give the middle of the scene a wide berth while it is set. */
  children?: ReactNode;
  /** Sharks on patrol, biggest first. @default a hammerhead, a great white and a reef shark */
  sharks?: SharkSpec[];
  /** Number of fish schools. @default 7 */
  schools?: number;
  /** Fish in each school. @default 16 */
  fishPerSchool?: number;
  /** Cell width in px; cells are about 1.45 times as tall. @default 8 */
  cell?: number;
  /** Built-in light or dark colors, or your own (any CSS color). An object starts from `base`. @default "light" */
  palette?: SharkSeaPalette;
  /** Fish dodge the cursor, and a click drops bait that fish and then a hungry shark come for. @default true */
  interactive?: boolean;
  /** Freezes the sea on its current frame. @default false */
  paused?: boolean;
}

const PALETTES: Record<"light" | "dark", SharkSeaColors> = {
  light: {
    background: "#f3f7f8",
    grid: "#e3ebee",
    wake: "#1f8fd6",
    skinLight: "#dfe5e9",
    skinDark: "#55636f",
    ink: "#18212b",
    edge: "#6f7f8c",
    fish: "#2a3f50",
    bait: "#d9480f",
  },
  dark: {
    background: "#05080c",
    grid: "#0f141b",
    wake: "#6ee2ff",
    skinLight: "#cfd5de",
    skinDark: "#23272f",
    ink: "#0c0e12",
    edge: "#8d96a5",
    fish: "#e4ecff",
    bait: "#ff7a45",
  },
};

const DEFAULT_SHARKS: SharkSpec[] = [{ kind: "hammerhead" }, { kind: "great-white", size: 0.84 }, { kind: "reef", size: 0.72 }];

/* ------------------------------------------------------------------ species */

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A torpedo outline: nose length and bluntness, width at the shoulder and widest point, tail stalk width and taper. */
const torpedo = (nose: number, bluntness: number, shoulder: number, widest: number, stalk: number, taper: number) => (s: number) => {
  if (s < nose) return shoulder * Math.sin(((s / nose) * Math.PI) / 2) ** bluntness;
  if (s < 0.3) return shoulder + (widest - shoulder) * smooth(nose, 0.3, s);
  if (s < 0.85) return stalk + (widest - stalk) * (1 - (s - 0.3) / 0.55) ** taper;
  return stalk * (1 - (s - 0.85) / 0.15) + 0.01 * Math.sin(((s - 0.85) / 0.15) * Math.PI);
};

interface Shape {
  /** Half-width along the body (0 snout → 1 tail), as a fraction of length. */
  width: (s: number) => number;
  /** Pectoral fin: leading root, trailing root, tip along the body, and reach out to the side. */
  pectoral: [number, number, number, number];
  /** Sickle-shaped trailing edge on the pectorals. */
  falcate: boolean;
  pelvic: [number, number, number, number];
  /** Reach of the forked tail; 0 for a whip tail drawn by the outline. */
  caudal: number;
  dorsal: [number, number];
  dorsal2: [number, number];
  eye: [number, number] | null;
  gills: [number, number];
  /** Hammerhead's head: half-span, how far the tips sweep back, and its depth. */
  head?: { span: number; sweep: number; depth: number };
  marks?: "bars" | "tips";
  /** Skin tint (r, g, b multipliers). */
  tint: [number, number, number];
}

const SHAPES: Record<SharkKind, Shape> = {
  "great-white": {
    width: torpedo(0.12, 0.8, 0.094, 0.11, 0.019, 1.15),
    pectoral: [0.16, 0.42, 0.53, 0.25],
    falcate: true,
    pelvic: [0.58, 0.65, 0.69, 0.08],
    caudal: 0.1,
    dorsal: [0.34, 0.47],
    dorsal2: [0.72, 0.76],
    eye: [0.09, 0.13],
    gills: [0.18, 0.28],
    tint: [0.95, 0.97, 1.02],
  },
  reef: {
    width: torpedo(0.13, 0.9, 0.074, 0.088, 0.016, 1.3),
    pectoral: [0.17, 0.4, 0.5, 0.21],
    falcate: true,
    pelvic: [0.57, 0.63, 0.67, 0.07],
    caudal: 0.1,
    dorsal: [0.33, 0.45],
    dorsal2: [0.7, 0.74],
    eye: [0.1, 0.14],
    gills: [0.19, 0.28],
    marks: "tips",
    tint: [0.9, 0.97, 1.08],
  },
  tiger: {
    width: torpedo(0.1, 0.45, 0.092, 0.104, 0.018, 1.2),
    pectoral: [0.15, 0.41, 0.52, 0.24],
    falcate: true,
    pelvic: [0.57, 0.64, 0.68, 0.08],
    caudal: 0.095,
    dorsal: [0.33, 0.46],
    dorsal2: [0.71, 0.75],
    eye: [0.08, 0.12],
    gills: [0.19, 0.28],
    marks: "bars",
    tint: [1.04, 0.96, 0.84],
  },
  hammerhead: {
    width: (s) => (s < 0.07 ? 0.042 : s < 0.3 ? 0.042 + 0.055 * smooth(0.07, 0.3, s) : torpedo(0.13, 0.9, 0.08, 0.097, 0.018, 1.25)(s)),
    head: { span: 0.19, sweep: 0.03, depth: 0.085 },
    pectoral: [0.17, 0.39, 0.49, 0.22],
    falcate: true,
    pelvic: [0.56, 0.62, 0.66, 0.07],
    caudal: 0.12,
    dorsal: [0.27, 0.43],
    dorsal2: [0.69, 0.73],
    eye: null,
    gills: [0.15, 0.25],
    tint: [0.97, 0.98, 0.9],
  },
  thresher: {
    width: (s) => {
      if (s < 0.08) return 0.07 * Math.sin(((s / 0.08) * Math.PI) / 2) ** 0.75;
      if (s < 0.2) return 0.07 + 0.018 * smooth(0.08, 0.2, s);
      if (s < 0.48) return 0.012 + 0.076 * (1 - (s - 0.2) / 0.28) ** 1.3;
      // The upper tail lobe: a long thin whip.
      const k = (s - 0.48) / 0.52;
      return 0.012 * (1 - k) + 0.006 * Math.sin(k * Math.PI * 0.9) + 0.002;
    },
    pectoral: [0.12, 0.28, 0.37, 0.21],
    falcate: true,
    pelvic: [0.37, 0.41, 0.44, 0.045],
    caudal: 0,
    dorsal: [0.23, 0.31],
    dorsal2: [0.45, 0.47],
    eye: [0.05, 0.1],
    gills: [0.11, 0.18],
    tint: [1, 0.92, 1.06],
  },
};
const KINDS = Object.keys(SHAPES) as SharkKind[];

/** Fish species: how they school. Strong alignment makes ribbons, a tangential pull makes a bait ball. */
const FISH = [
  { cruise: 34, max: 62, min: 16, spacing: [1.8, 1.1], align: 1.5, cohesion: 1.6, jitter: 40, mill: 65, drag: 0.6 },
  { cruise: 44, max: 76, min: 22, spacing: [1.5, 1], align: 3, cohesion: 0.5, jitter: 28, mill: 0, drag: 1.3 },
  { cruise: 26, max: 54, min: 10, spacing: [1.4, 1.1], align: 0.4, cohesion: 1.3, jitter: 100, mill: 0, drag: 0.3 },
] as const;

/* ------------------------------------------------------------------ glyphs */

const GLYPHS = [..." .'`,:;-=+t%S#8@o*·"];
const G = Object.fromEntries(GLYPHS.map((g, i) => [g, i])) as Record<string, number>;
/** Sparse glyphs on lit skin, dense ones in shadow, so the texture follows the shading. */
const SKIN = [G[":"], G[";"], G["="], G["+"], G["t"], G["%"], G["S"], G["8"], G["#"], G["@"]];
const FIN = [G["%"], G[";"], G["t"], G["S"], G[":"]];
const RIDGE = [G["@"], G["8"], G["%"]];
const EDGE_HEAVY = [G[":"], G[";"]];
const EDGE_LIGHT = [G["."], G["'"], G[","], G["`"]];
const SHIMMER = ["#f08a24", "#e5484d", "#9b5de5", "#12b5cb", "#30a46c", "#3e63dd", "#e2b714"];
/** Atlas color slots. */
const C = { ink: 0, edge: 1, fish: 2, bait: 3, eye: 4, white: 5, shimmer: 6 } as const;

const SHADES = 12;
const DEPTHS = 3;
const SEGMENTS = 20;
const STEP = 1 / 60;

/* ------------------------------------------------------------------ simulation types */

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: number;
  alarm: number;
  alive: boolean;
  respawnAt: number;
  turn: number;
  depth: number;
  mill: 1 | -1;
}

interface Shark {
  kind: SharkKind;
  length: number;
  depth: number;
  nodes: Float32Array;
  heading: number;
  speed: number;
  phase: number;
  turn: number;
  hunger: number;
  wander: number;
  orbit: number;
  orbitDir: 1 | -1;
  target: Fish | null;
  retargetAt: number;
  seed: number;
}

interface Bait {
  x: number;
  y: number;
  t: number;
}

function resolvePalette(palette: SharkSeaPalette): SharkSeaColors {
  if (palette === "light" || palette === "dark") return PALETTES[palette];
  return { ...PALETTES[palette.base ?? "light"], ...palette };
}

const angleDiff = (a: number, b: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

function inTriangle(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

/**
 * An ASCII ocean seen from above. Sharks (hammerhead, great white, reef, tiger, thresher) patrol on
 * follow-the-leader spines with a body wave and banked fins, drawn as shaded blocks under glyphs
 * that thicken into shadow, with soft supersampled edges and a skin that now and then shimmers.
 * Fish schools flock, pass alarm through the school, break around a passing shark and regroup;
 * hungry sharks pick off stragglers. Everything leaves a wake that lights the water and fades.
 * Fish dodge the cursor and a click drops bait. Glyphs come from a shared atlas; the canvas pauses
 * offscreen and in hidden tabs and settles into a still frame under reduced motion.
 */
export function AsciiSharkSea({
  children,
  sharks = DEFAULT_SHARKS,
  schools = 7,
  fishPerSchool = 16,
  cell = 8,
  palette = "light",
  interactive = true,
  paused = false,
  className,
  style,
  ...props
}: AsciiSharkSeaProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = resolvePalette(palette);
  const colorKey = JSON.stringify(colors);
  const sharkKey = JSON.stringify(sharks.map((s) => ({ kind: SHAPES[s.kind] ? s.kind : "reef", size: Math.max(0.4, Math.min(1.6, s.size ?? 1)) })));
  const hasContent = children != null;
  const live = useRef({ interactive, paused, hasContent, loop: null as CanvasLoop | null });

  useEffect(() => {
    live.current.interactive = interactive;
    live.current.paused = paused;
    live.current.hasContent = hasContent;
    live.current.loop?.wake();
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const state = live.current;
    const specs: { kind: SharkKind; size: number }[] = JSON.parse(sharkKey);
    const pal: SharkSeaColors = JSON.parse(colorKey);
    const fontFamily = monoFontFamily(root);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const [bgRgb, lightRgb, darkRgb] = [pal.background, pal.skinLight, pal.skinDark].map((c) => parseColor(resolveCanvasColors([c], root)[0]));
    const atlasColors = resolveCanvasColors([pal.ink, pal.edge, pal.fish, pal.bait, pal.edge, "#ffffff", ...SHIMMER], root);
    const wakeRgb = parseColor(resolveCanvasColors([pal.wake], root)[0]);
    const wakeStyles = [0.3, 0.45, 0.6, 0.75, 0.88, 1].map((a) => `rgba(${wakeRgb.join(",")},${a})`);
    const shadowStyle = `rgba(${darkRgb.join(",")},0.1)`;

    // Block colors: species × depth × shade, mixed toward the water for deeper sharks.
    const blockStyles = [""];
    for (let k = 0; k < KINDS.length; k++) {
      const tint = SHAPES[KINDS[k]].tint;
      for (let d = 0; d < DEPTHS; d++) {
        const fade = (DEPTHS - 1 - d) * 0.2;
        for (let l = 0; l < SHADES; l++) {
          const t = l / (SHADES - 1);
          const skin = [0, 1, 2].map((ch) => Math.min(255, (darkRgb[ch] + (lightRgb[ch] - darkRgb[ch]) * t) * tint[ch]));
          blockStyles.push(mix3(skin, bgRgb, fade));
        }
      }
    }
    const blockIndex = (kind: number, depth: number, shade: number) => 1 + (kind * DEPTHS + depth) * SHADES + Math.min(SHADES - 1, Math.max(0, Math.round(shade * (SHADES - 1))));

    let grid: CellGrid = cellGrid(1, 1, cell);
    let width = 1;
    let height = 1;
    let dpr = 1;
    let atlas: GlyphAtlas | null = null;
    let wake = new WakeField(1, 1);
    let heat = new Float32Array(1);
    let cells = new CellBuffer(1);
    let shadow = new Uint8Array(1);
    let background: HTMLCanvasElement | null = null;
    let disposed = false;
    let time = 0;
    let acc = 0;
    let lastSpawn = 0;
    let seeded = false;
    let fish: Fish[] = [];
    let fleet: Shark[] = [];
    const baits: Bait[] = [];
    const pointer = { x: 0, y: 0, active: false };
    const hit: SpineHit = { s: 0, v: 0, dist: 0, nx: 0, ny: 0 };
    const spine = new Float32Array(SEGMENTS * 2);
    const arc = new Float32Array(SEGMENTS);
    let perception = 60;
    let sepX = [0, 0, 0];
    let sepY = [0, 0, 0];
    let buckets = { cols: 1, rows: 1, head: new Int32Array(1), count: new Uint16Array(1), next: new Int32Array(1) };

    const buildAtlas = () => {
      atlas = getGlyphAtlas({ glyphs: GLYPHS, colors: atlasColors, cell: grid.ch, dpr, fontFamily, fontWeight: 600, fontScale: 0.74 });
    };

    const paintBackground = () => {
      background ??= document.createElement("canvas");
      background.width = Math.round(width * dpr);
      background.height = Math.round(height * dpr);
      const g = background.getContext("2d");
      if (!g) return;
      g.fillStyle = resolveCanvasColors([pal.background], root)[0];
      g.fillRect(0, 0, background.width, background.height);
      g.strokeStyle = resolveCanvasColors([pal.grid], root)[0];
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

    /* ---------------------------------------------------------- world */

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const seed = () => {
      seeded = true;
      const minSide = Math.min(width, height);
      const base = Math.max(160, Math.min(440, minSide * 0.54));
      fleet = specs.map((spec, i) => {
        const length = base * spec.size;
        const orbit = minSide * rand(0.26, 0.38);
        const a = (i / specs.length) * Math.PI * 2 + rand(-0.4, 0.4);
        const orbitDir: 1 | -1 = i % 2 === 0 ? 1 : -1;
        const x = width / 2 + Math.cos(a) * orbit * (width / minSide) * 0.9;
        const y = height / 2 + Math.sin(a) * orbit;
        const heading = a + (orbitDir * Math.PI) / 2;
        return {
          kind: spec.kind,
          length,
          depth: Math.min(DEPTHS - 1, Math.max(0, Math.round(((spec.size - 0.4) / 0.6) * (DEPTHS - 1)))),
          nodes: straightSpine(SEGMENTS, x, y, heading, length),
          heading,
          speed: 30,
          phase: rand(0, Math.PI * 2),
          turn: 0,
          hunger: rand(0.2, 0.7),
          wander: 0,
          orbit,
          orbitDir,
          target: null,
          retargetAt: 0,
          seed: i + 1,
        };
      });
      // Smaller (deeper) sharks draw first, so bigger ones pass over them.
      fleet.sort((a, b) => a.length - b.length);
      fish = [];
      for (let k = 0; k < schools; k++) {
        const kind = k % FISH.length;
        const sp = FISH[kind];
        const cx = rand(width * 0.08, width * 0.92);
        const cy = rand(height * 0.1, height * 0.9);
        const dir = (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.5, 0.5);
        const mill: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
        for (let f = 0; f < fishPerSchool; f++) {
          fish.push({
            x: cx + rand(-1, 1) * sepX[kind] * Math.sqrt(fishPerSchool),
            y: cy + rand(-1, 1) * sepY[kind] * Math.sqrt(fishPerSchool) * 0.6,
            vx: Math.cos(dir) * sp.cruise,
            vy: Math.sin(dir) * sp.cruise,
            kind,
            alarm: 0,
            alive: true,
            respawnAt: 0,
            turn: 0,
            depth: rand(0.55, 1),
            mill,
          });
        }
      }
      buckets.next = new Int32Array(fish.length);
    };

    const bucketOf = (x: number, y: number) => {
      const c = Math.min(buckets.cols - 1, Math.max(0, Math.floor(x / perception) + 1));
      const r = Math.min(buckets.rows - 1, Math.max(0, Math.floor(y / perception) + 1));
      return r * buckets.cols + c;
    };

    const rebuildBuckets = () => {
      const cols = Math.ceil(width / perception) + 2;
      const rows = Math.ceil(height / perception) + 2;
      if (cols * rows !== buckets.head.length) buckets = { cols, rows, head: new Int32Array(cols * rows), count: new Uint16Array(cols * rows), next: buckets.next };
      buckets.cols = cols;
      buckets.rows = rows;
      buckets.head.fill(-1);
      buckets.count.fill(0);
      if (buckets.next.length !== fish.length) buckets.next = new Int32Array(fish.length);
      fish.forEach((f, i) => {
        if (!f.alive) return;
        const b = bucketOf(f.x, f.y);
        buckets.next[i] = buckets.head[b];
        buckets.head[b] = i;
        buckets.count[b]++;
      });
    };

    /** A gentle, divergence-free current (the curl of a drifting stream function). */
    const current = (x: number, y: number) => {
      const a = x / 280 + time * 0.06;
      const b = y / 330 - time * 0.045;
      const c = (x + y) / 210 + time * 0.1;
      return [((-Math.sin(a) * Math.sin(b)) / 330 + (0.5 * Math.cos(c)) / 210) * 3200, ((-Math.cos(a) * Math.cos(b)) / 280 - (0.5 * Math.cos(c)) / 210) * 3200];
    };

    const burst = (x: number, y: number) => {
      const i = cellAt(grid, x, y);
      if (i >= 0) heat[i] = 1;
      wake.stamp(grid, x, y, 3, 0.9);
    };

    const stepFish = (dt: number) => {
      const R2 = perception * perception;
      const calm = Math.exp(-dt * 0.7);
      const spread = Math.min(1, dt * 6);
      const bait = baits[0];
      for (let i = 0; i < fish.length; i++) {
        const f = fish[i];
        if (!f.alive) continue;
        const sp = FISH[f.kind];
        const roomX = sepX[f.kind] * (1 + 1.8 * f.alarm);
        const roomY = sepY[f.kind] * (1 + 1.8 * f.alarm);
        const speed = Math.hypot(f.vx, f.vy) || 1;
        const hx = f.vx / speed;
        const hy = f.vy / speed;
        let ax = 0;
        let ay = 0;
        let sx = 0;
        let sy = 0;
        let avx = 0;
        let avy = 0;
        let cx = 0;
        let cy = 0;
        let n = 0;
        let heard = 0;
        const bc = Math.min(buckets.cols - 1, Math.max(0, Math.floor(f.x / perception) + 1));
        const br = Math.min(buckets.rows - 1, Math.max(0, Math.floor(f.y / perception) + 1));
        for (let r = Math.max(0, br - 1); r <= Math.min(buckets.rows - 1, br + 1); r++) {
          for (let c = Math.max(0, bc - 1); c <= Math.min(buckets.cols - 1, bc + 1); c++) {
            for (let j = buckets.head[r * buckets.cols + c]; j !== -1; j = buckets.next[j]) {
              if (j === i) continue;
              const o = fish[j];
              const dx = o.x - f.x;
              const dy = o.y - f.y;
              const d2 = dx * dx + dy * dy;
              if (d2 > R2 || d2 < 1e-6) continue;
              const d = Math.sqrt(d2);
              // A blind spot behind each fish.
              if ((dx * hx + dy * hy) / d < -0.62) continue;
              const qx = dx / roomX;
              const qy = dy / roomY;
              const q2 = qx * qx + qy * qy;
              if (q2 < 1) {
                const q = Math.sqrt(q2) || 1e-3;
                sx -= (qx * (1 - q)) / q;
                sy -= (qy * (1 - q)) / q;
              }
              if (o.kind === f.kind) {
                avx += o.vx;
                avy += o.vy;
                cx += dx;
                cy += dy;
                n++;
              } else if (d < grid.cw * 3) {
                sx -= (dx / d) * (1 - d / (grid.cw * 3)) * 0.6;
                sy -= (dy / d) * (1 - d / (grid.cw * 3)) * 0.6;
              }
              heard = Math.max(heard, o.alarm);
            }
          }
        }
        ax += sx * 420;
        ay += sy * 420;
        if (n) {
          const cohesion = sp.cohesion * (1 - 0.8 * f.alarm);
          ax += (avx / n - f.vx) * 1.4 * sp.align + (cx / n) * cohesion;
          ay += (avy / n - f.vy) * 1.4 * sp.align + (cy / n) * cohesion;
          if (sp.mill) {
            const cl = Math.hypot(cx, cy) || 1;
            ax += (-cy / cl) * f.mill * sp.mill * (1 - f.alarm);
            ay += (cx / cl) * f.mill * sp.mill * (1 - f.alarm);
          }
        }
        // Sharks: flee the front half of the body, breaking to whichever side of its path you're on.
        let fear = 0;
        for (const sh of fleet) {
          const reach = sh.length * 0.6 + 60;
          let best = Infinity;
          let bx = 0;
          let by = 0;
          for (let k = 0; k <= 12; k += 3) {
            const d2 = (f.x - sh.nodes[k * 2]) ** 2 + (f.y - sh.nodes[k * 2 + 1]) ** 2;
            if (d2 < best) {
              best = d2;
              bx = sh.nodes[k * 2];
              by = sh.nodes[k * 2 + 1];
            }
          }
          const d = Math.sqrt(best);
          if (d >= reach || d < 1e-3) continue;
          const w = (1 - d / reach) ** 2;
          const hxs = Math.cos(sh.heading);
          const hys = Math.sin(sh.heading);
          const side = hxs * (f.y - sh.nodes[1]) - hys * (f.x - sh.nodes[0]) >= 0 ? 1 : -1;
          ax += (((f.x - bx) / d) * 0.7 - hys * side * 0.9) * 1100 * w;
          ay += (((f.y - by) / d) * 0.7 + hxs * side * 0.9) * 1100 * w;
          fear = Math.max(fear, Math.sqrt(w));
        }
        if (pointer.active && state.interactive) {
          const dx = f.x - pointer.x;
          const dy = f.y - pointer.y;
          const d = Math.hypot(dx, dy);
          const reach = grid.cw * 12;
          if (d < reach && d > 1e-3) {
            const w = (1 - d / reach) ** 2;
            ax += (dx / d) * 1100 * w;
            ay += (dy / d) * 1100 * w;
            fear = Math.max(fear, Math.sqrt(w) * 0.8);
          }
        }
        // Calm fish come for bait.
        if (bait && fear < 0.2) {
          const dx = bait.x - f.x;
          const dy = bait.y - f.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < grid.cw * 26) {
            ax += (dx / d) * 140;
            ay += (dy / d) * 140;
          }
        }
        // Alarm: set by a threat, passed on by neighbors, fading on its own.
        let alarm = Math.max(f.alarm * calm, fear);
        if (heard * 0.86 > alarm) alarm += (heard * 0.86 - alarm) * spread;
        f.alarm = alarm;
        const m = 34;
        if (f.x < m) ax += (m - f.x) * 7;
        else if (f.x > width - m) ax -= (f.x - (width - m)) * 7;
        if (f.y < m) ay += (m - f.y) * 7;
        else if (f.y > height - m) ay -= (f.y - (height - m)) * 7;
        const [ux, uy] = current(f.x, f.y);
        ax += ux * 0.5 + (Math.random() - 0.5) * sp.jitter;
        ay += uy * 0.5 + (Math.random() - 0.5) * sp.jitter;
        ay -= f.vy * sp.drag * (1 - 0.7 * f.alarm);
        const preferred = sp.cruise * (1 + 1.3 * f.alarm);
        ax += (preferred - speed) * hx * 1.6;
        ay += (preferred - speed) * hy * 1.6;
        const before = Math.atan2(f.vy, f.vx);
        f.vx += ax * dt;
        f.vy += ay * dt;
        const max = sp.max * (1 + 1.8 * f.alarm);
        const s = Math.hypot(f.vx, f.vy);
        if (s > max) {
          f.vx *= max / s;
          f.vy *= max / s;
        } else if (s < sp.min && s > 1e-3) {
          f.vx *= sp.min / s;
          f.vy *= sp.min / s;
        }
        f.turn += (angleDiff(before, Math.atan2(f.vy, f.vx)) / dt - f.turn) * Math.min(1, dt * 8);
        f.x = Math.min(width + 60, Math.max(-60, f.x + f.vx * dt));
        f.y = Math.min(height + 60, Math.max(-60, f.y + f.vy * dt));
      }
    };

    const findPrey = (sh: Shark) => {
      const range = sh.length * 0.9 + 160;
      const fx = Math.cos(sh.heading);
      const fy = Math.sin(sh.heading);
      let best: Fish | null = null;
      let bestScore = Infinity;
      let keep = Infinity;
      for (const f of fish) {
        if (!f.alive) continue;
        const dx = f.x - sh.nodes[0];
        const dy = f.y - sh.nodes[1];
        const d = Math.hypot(dx, dy);
        if (d > range || d < 1e-3) continue;
        const cos = (dx * fx + dy * fy) / d;
        if (cos < 0.2) continue;
        if (state.hasContent && ((f.x - width / 2) / (width * 0.4)) ** 2 + ((f.y - height / 2) / (height * 0.3)) ** 2 < 1) continue;
        // Stragglers in sparse water are easier than fish buried in a school.
        const score = d * (1 + (1 - cos) * 0.8) * (1 + buckets.count[bucketOf(f.x, f.y)] * 0.07);
        if (score < bestScore) {
          bestScore = score;
          best = f;
        }
        if (f === sh.target) keep = score;
      }
      return sh.target && keep < bestScore * 1.3 ? sh.target : best;
    };

    const stepSharks = (dt: number) => {
      const minSide = Math.min(width, height);
      const cx = width / 2;
      const cy = height / 2;
      for (const sh of fleet) {
        const bait = baits[0];
        const L = sh.length;
        const n = sh.nodes;
        const hx = n[0];
        const hy = n[1];
        sh.hunger = Math.min(1, sh.hunger + dt * 0.03);
        let dx = Math.cos(sh.heading);
        let dy = Math.sin(sh.heading);
        sh.wander = Math.max(-1.1, Math.min(1.1, sh.wander + (Math.random() - 0.5) * dt * 3.2));
        dx += Math.cos(sh.heading + sh.wander) * 0.45;
        dy += Math.sin(sh.heading + sh.wander) * 0.45;
        if (time >= sh.retargetAt) {
          sh.target = findPrey(sh);
          sh.retargetAt = time + 0.45;
        }
        let hunting = false;
        let closing = 0;
        const bd = bait ? Math.hypot(bait.x - hx, bait.y - hy) : Infinity;
        const goal = bait && sh.hunger > 0.25 && bd < L * 2.2 ? { x: bait.x, y: bait.y, vx: 0, vy: 0 } : sh.target && sh.target.alive && sh.hunger > 0.3 ? sh.target : null;
        if (goal) {
          const tx = goal.x + goal.vx * 0.35 - hx;
          const ty = goal.y + goal.vy * 0.35 - hy;
          const d = Math.hypot(tx, ty) || 1;
          dx += (tx / d) * (1.4 + 2.6 * sh.hunger);
          dy += (ty / d) * (1.4 + 2.6 * sh.hunger);
          hunting = true;
          closing = Math.max(0, Math.min(1, 1 - d / (L * 0.9)));
        } else {
          // Patrol: a lazy loop around the middle.
          const rx = (hx - cx) / (width / minSide);
          const ry = hy - cy;
          const r = Math.hypot(rx, ry) || 1;
          const radius = sh.orbit * (1 + 0.15 * Math.sin(time * 0.05 + sh.seed));
          const radial = Math.max(-1, Math.min(1, (radius - r) / radius));
          dx += ((-ry / r) * sh.orbitDir + (rx / r) * radial * 0.9) * 0.55;
          dy += ((rx / r) * sh.orbitDir + (ry / r) * radial * 0.9) * 0.55;
        }
        for (const other of fleet) {
          if (other === sh) continue;
          for (let k = 0; k < SEGMENTS; k += 4) {
            const ox = hx - other.nodes[k * 2];
            const oy = hy - other.nodes[k * 2 + 1];
            const d = Math.hypot(ox, oy);
            const range = (L + other.length) * 0.45;
            if (d < range && d > 1e-3) {
              dx += (ox / d) * (1 - d / range) * 3;
              dy += (oy / d) * (1 - d / range) * 3;
            }
          }
        }
        // Keep the middle readable when there is content on top.
        if (state.hasContent) {
          // The ellipse reaches past the content a little, so even the tail rarely crosses it.
          const ex = (hx - cx) / (width * 0.4);
          const ey = (hy - cy) / (height * 0.3);
          const e2 = ex * ex + ey * ey;
          if (e2 < 1) {
            const e = Math.sqrt(e2) || 1e-3;
            dx += (ex / e) * (1 - e) * (hunting ? 3 : 5);
            dy += (ey / e) * (1 - e) * (hunting ? 3 : 5);
          }
        }
        // Turn back once the snout leaves the frame.
        const over = Math.max(-hx, hx - width, -hy, hy - height);
        if (over > -L * 0.05) {
          const w = Math.max(0, Math.min(1, (over + L * 0.05) / (L * 0.35))) * 3.5;
          const d = Math.hypot(cx - hx, cy - hy) || 1;
          dx += ((cx - hx) / d) * w;
          dy += ((cy - hy) / d) * w;
        }
        const desired = Math.atan2(dy, dx);
        const agility = Math.min(hunting ? 1.7 + closing : 0.8, sh.speed / (L * (hunting ? 0.22 : 0.3)));
        const turned = Math.max(-agility * dt, Math.min(agility * dt, angleDiff(sh.heading, desired)));
        sh.heading += turned;
        sh.turn += (turned / dt - sh.turn) * Math.min(1, dt * 3);
        const cruise = 30 + L * 0.04;
        sh.speed += ((hunting ? cruise * (1.45 + closing * 1.5) : cruise) - sh.speed) * Math.min(1, dt * 1.1);
        sh.phase += dt * (2 + sh.speed / 24);
        n[0] += Math.cos(sh.heading) * sh.speed * dt;
        n[1] += Math.sin(sh.heading) * sh.speed * dt;
        followSpine(n, sh.heading, L / (SEGMENTS - 1), 0.16);
        const mouth = L * 0.05 + 8;
        if (bait && bd < mouth + grid.cw) {
          baits.shift();
          sh.hunger = Math.max(0, sh.hunger - 0.4);
          burst(bait.x, bait.y);
        }
        if (sh.hunger > 0.15) {
          for (const f of fish) {
            if (!f.alive || (f.x - n[0]) ** 2 + (f.y - n[1]) ** 2 > mouth * mouth) continue;
            f.alive = false;
            f.respawnAt = time + rand(3, 8);
            sh.hunger = Math.max(0, sh.hunger - 0.16);
            burst(f.x, f.y);
          }
        }
      }
    };

    const respawn = () => {
      const due = fish.filter((f) => !f.alive && f.respawnAt <= time);
      if (!due.length || (due.length < 6 && time - lastSpawn < 9)) return;
      lastSpawn = time;
      // A new school swims in from an edge.
      const side = Math.floor(Math.random() * 4);
      const along = rand(0.15, 0.85);
      const x = side === 0 ? -20 : side === 1 ? width + 20 : along * width;
      const y = side === 2 ? -20 : side === 3 ? height + 20 : along * height;
      const inward = Math.atan2(height / 2 - y, width / 2 - x) + rand(-0.5, 0.5);
      const kind = Math.floor(Math.random() * FISH.length);
      const mill: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      for (const f of due.slice(0, fishPerSchool)) {
        Object.assign(f, {
          alive: true,
          kind,
          alarm: 0,
          turn: 0,
          mill,
          x: x + rand(-1, 1) * perception,
          y: y + rand(-1, 1) * perception,
          vx: Math.cos(inward) * FISH[kind].cruise * 1.4,
          vy: Math.sin(inward) * FISH[kind].cruise * 1.4,
        });
      }
    };

    const step = (dt: number) => {
      time += dt;
      rebuildBuckets();
      stepFish(dt);
      stepSharks(dt);
      respawn();
      for (let i = baits.length - 1; i >= 0; i--) {
        baits[i].t += dt;
        if (baits[i].t > 14) baits.splice(i, 1);
      }
      // Wakes: fish trickle energy, shark tails sweep a lot, the pointer stirs a little.
      for (const f of fish) if (f.alive) wake.add(cellAt(grid, f.x, f.y), 0.012 + f.alarm * 0.03);
      for (const sh of fleet) for (let k = SEGMENTS - 6; k < SEGMENTS; k++) wake.add(cellAt(grid, sh.nodes[k * 2], sh.nodes[k * 2 + 1]), 0.05 + sh.speed * 0.0012);
      if (pointer.active && state.interactive) wake.stamp(grid, pointer.x, pointer.y, 1, 0.06);
      wake.step(dt);
      const cool = Math.exp(-dt * 2.2);
      for (let i = 0; i < heat.length; i++) heat[i] *= cool;
    };

    /* ---------------------------------------------------------- rendering */

    const tips = { left: 0, right: 0 };
    const shadeOut = { shade: 0 };

    /** Classifies a point against the shark whose spine is loaded: 0 miss, 1 skin, 2 dorsal ridge, 3 fin, 4 eye, 5 marking. */
    const sample = (sh: Shark, shape: Shape, total: number, px: number, py: number) => {
      const L = sh.length;
      nearestOnSpine(spine, arc, total, px, py, hit);
      const a = hit.dist;
      const s = hit.s;
      const u = s * L;
      if (shape.head && u < L * (shape.head.sweep + shape.head.depth)) {
        const r = a / (L * shape.head.span);
        const front = L * shape.head.sweep * r * r;
        if (r <= 1 && u >= front && u <= front + L * shape.head.depth * (1 - 0.2 * r ** 4)) {
          shadeOut.shade = r > 0.86 ? 0 : 0.62 - 0.2 * r + (u < front + L * 0.012 ? 0.1 : 0);
          return r > 0.86 ? 4 : 1;
        }
      }
      const w = shape.width(s) * L;
      if (a <= w) {
        const across = a / (w || 1);
        // A rounded back lit from the top left; the flanks fall into shadow.
        const facing = (hit.nx * -0.6 + hit.ny * -0.8) * across;
        let shade = 0.6 - across * across * 0.44 + facing * 0.27;
        let flag = 1;
        if (s > shape.dorsal[0] && s < shape.dorsal[1] && across < 0.3) {
          flag = 2;
          shade = 1;
        } else if (s > shape.dorsal2[0] && s < shape.dorsal2[1] && across < 0.4) shade = Math.max(shade, 0.84);
        else if (shape.eye && s > shape.eye[0] && s < shape.eye[1] && across > 0.6) {
          flag = 4;
          shade = 0;
        } else if (s > shape.gills[0] && s < shape.gills[1] && across > 0.58) {
          if (Math.floor(((s - shape.gills[0]) / (shape.gills[1] - shape.gills[0])) * 5) % 2 === 0) shade *= 0.45;
        } else if (s < 0.045) shade = Math.max(shade, 0.72);
        else if (shape.marks === "bars" && s > 0.2 && s < 0.9 && across < 0.85) {
          const bar = Math.sin(s * Math.PI * 18 + 0.35 * Math.sin((hit.v / L) * 25 + s * 5));
          if (bar > 0.65 - 0.5 * smooth(0.2, 0.42, s) + 0.4 * smooth(0.8, 0.9, s)) flag = 5;
        }
        shadeOut.shade = shade;
        return flag;
      }
      const tip = hit.v > 0 ? tips.right : tips.left;
      const [p0, p1, p2] = shape.pectoral;
      if (inTriangle(u, a, L * p0, 0, L * p1, 0, L * p2, tip) && !(shape.falcate && inTriangle(u, a, L * p1, 0, L * (p1 + (p2 - p1) * 0.33), tip * 0.55, L * p2, tip))) {
        shadeOut.shade = 0.38 + 0.22 * (1 - Math.min(1, a / tip));
        return shape.marks === "tips" && a > tip * 0.72 ? 5 : 3;
      }
      const [v0, v1, v2, vr] = shape.pelvic;
      const tail = shape.caudal > 0 && inTriangle(u, a, L * 0.86, 0, L * 0.95, 0, L, L * shape.caudal);
      if (inTriangle(u, a, L * v0, 0, L * v1, 0, L * v2, L * vr) || tail) {
        shadeOut.shade = 0.36;
        return tail && shape.marks === "tips" && a > L * shape.caudal * 0.6 ? 5 : 3;
      }
      return 0;
    };

    const rasterSharks = () => {
      shadow.fill(0);
      for (const sh of fleet) {
        const shape = SHAPES[sh.kind];
        const kindIndex = KINDS.indexOf(sh.kind);
        const L = sh.length;
        const total = waveSpine(sh.nodes, spine, arc, sh.phase, L * 0.05 * Math.max(0.4, Math.min(1.4, sh.speed / 60)), 5.2);
        // Bank into turns: the inside fin foreshortens.
        const bank = Math.max(-0.35, Math.min(0.35, sh.turn * 0.45));
        const flex = 1 + 0.06 * Math.sin(sh.phase * 0.5);
        tips.right = L * shape.pectoral[3] * flex * (1 - bank);
        tips.left = L * shape.pectoral[3] * flex * (1 + bank);
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (let k = 0; k < SEGMENTS; k++) {
          minX = Math.min(minX, spine[k * 2]);
          maxX = Math.max(maxX, spine[k * 2]);
          minY = Math.min(minY, spine[k * 2 + 1]);
          maxY = Math.max(maxY, spine[k * 2 + 1]);
        }
        const reach = L * 0.36;
        const c0 = Math.max(0, Math.floor((minX - reach) / grid.cw));
        const c1 = Math.min(grid.cols - 1, Math.floor((maxX + reach) / grid.cw));
        const r0 = Math.max(0, Math.floor((minY - reach) / grid.ch));
        const r1 = Math.min(grid.rows - 1, Math.floor((maxY + reach) / grid.ch));
        const skip = reach + Math.hypot(grid.cw, grid.ch);
        const sdc = Math.round((L * 0.035) / grid.cw) + 1;
        const sdr = Math.round((L * 0.02) / grid.ch) + 1;
        const depth = 1 + sh.depth;
        const tick = Math.floor(time * 2.4);
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const x = c * grid.cw;
            const y = r * grid.ch;
            const flag = sample(sh, shape, total, x + grid.cw / 2, y + grid.ch / 2);
            if (!flag && hit.dist > skip) continue;
            const shade = shadeOut.shade;
            const s = hit.s;
            const v = hit.v;
            let hits = flag ? 1 : 0;
            for (let k = 0; k < SUBSAMPLES.length; k += 2) if (sample(sh, shape, total, x + SUBSAMPLES[k] * grid.cw, y + SUBSAMPLES[k + 1] * grid.ch)) hits++;
            if (!hits) continue;
            const i = r * grid.cols + c;
            // Glyphs keyed to body coordinates ride along with the skin.
            const key = (hash3(Math.round(s * 52), Math.round(v / (grid.cw * 0.9)), sh.seed) * 4294967295) >>> 0;
            const roll = hash3(key, tick + Math.floor((key % 997) / 97), 7);
            if (flag && hits >= 3) {
              let glyph: number;
              let color: number = C.ink;
              let block = blockIndex(kindIndex, sh.depth, shade);
              if (flag === 2) glyph = RIDGE[(key >>> 8) % RIDGE.length];
              else if (flag === 4) {
                glyph = G.o;
                color = C.eye;
                block = blockIndex(kindIndex, sh.depth, 0.02);
              } else if (flag === 5) {
                glyph = (key >>> 8) % 2 ? G["#"] : G["%"];
                block = blockIndex(kindIndex, sh.depth, 0.12);
              } else if (flag === 3) glyph = FIN[(key >>> 8) % FIN.length];
              else glyph = SKIN[Math.max(0, Math.min(SKIN.length - 1, Math.floor((1 - shade) * (SKIN.length - 0.01)) + (((key >>> 4) % 3) - 1)))];
              // Now and then a glyph catches a color or a glint.
              if (flag !== 4 && flag !== 5) color = roll < 0.08 ? C.shimmer + (key % SHIMMER.length) : roll < 0.12 ? C.white : color;
              cells.set(i, depth, block, glyph, color);
              const sc = c + sdc;
              const sr = r + sdr;
              if (sc < grid.cols && sr < grid.rows) shadow[sr * grid.cols + sc] = 1;
            } else {
              // Soft edge: a light glyph, no block.
              const set = hits >= 3 ? EDGE_HEAVY : EDGE_LIGHT;
              cells.set(i, depth - 0.5, 0, set[(key >>> 8) % set.length], roll < 0.07 ? C.shimmer + (key % SHIMMER.length) : C.edge, Math.round((0.45 + hits * 0.11) * 255 * (0.75 + sh.depth * 0.12)));
            }
          }
        }
      }
    };

    const drawWake = () => {
      const e = wake.energy;
      const size = Math.max(2, Math.round(grid.cw * 0.3));
      for (let level = 0; level < wakeStyles.length; level++) {
        ctx.fillStyle = wakeStyles[level];
        for (let i = 0; i < e.length; i++) {
          if (e[i] < 0.28 || cells.depth[i] >= 0) continue;
          if (Math.min(wakeStyles.length - 1, Math.floor((e[i] - 0.28) * 5)) !== level) continue;
          ctx.fillRect(Math.round((i % grid.cols) * grid.cw + grid.cw * 0.62), Math.round(((i / grid.cols) | 0) * grid.ch + grid.ch * 0.62), size, size);
        }
      }
    };

    const render = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (background) ctx.drawImage(background, 0, 0);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!seeded) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells.clear();
      rasterSharks();
      // Fish: one dash per cell; nearer, turning or startled fish are brighter.
      for (const f of fish) {
        if (!f.alive) continue;
        const i = cellAt(grid, f.x, f.y);
        if (i < 0 || cells.depth[i] >= 0.2) continue;
        const glint = Math.min(1, Math.abs(f.turn) / 3.5);
        const v = 0.3 + (0.4 * (f.depth - 0.55)) / 0.45 + 0.3 * Math.max(glint, f.alarm);
        cells.set(i, 0.1 + f.depth * 0.05, 0, G["-"], C.fish, Math.round(Math.min(1, 0.25 + v * 0.75) * 255));
      }
      // Feeding sparks and bait.
      for (let i = 0; i < heat.length; i++) if (heat[i] > 0.08 && cells.depth[i] < 0.5) cells.set(i, 0.5, 0, heat[i] > 0.6 ? G["*"] : G["·"], C.bait, Math.round(Math.min(1, heat[i] * 1.4) * 255));
      for (const b of baits) cells.set(cellAt(grid, b.x, b.y), 0.6, 0, G["*"], C.bait);
      // Shark shadows dim the water under them.
      ctx.fillStyle = shadowStyle;
      for (let i = 0; i < shadow.length; i++) if (shadow[i] && cells.depth[i] < 0) ctx.fillRect((i % grid.cols) * grid.cw, ((i / grid.cols) | 0) * grid.ch, grid.cw, grid.ch);
      drawWake();
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
        const changed = next.cols !== grid.cols || next.rows !== grid.rows;
        grid = next;
        if (changed) {
          wake = new WakeField(grid.cols, grid.rows);
          heat = new Float32Array(grid.cols * grid.rows);
          cells = new CellBuffer(grid.cols * grid.rows);
          shadow = new Uint8Array(grid.cols * grid.rows);
        }
        perception = Math.max(grid.ch * 3, grid.cw * 5.5);
        sepX = FISH.map((sp) => sp.spacing[0] * grid.cw);
        sepY = FISH.map((sp) => sp.spacing[1] * grid.ch);
        buildAtlas();
        paintBackground();
        if (!seeded) {
          seed();
          // A still frame (reduced motion) shows the sea after it has settled.
          if (frame.still) for (let k = 0; k < 240; k++) step(STEP);
        } else {
          for (const f of fish) {
            f.x = Math.min(width, Math.max(0, f.x));
            f.y = Math.min(height, Math.max(0, f.y));
          }
        }
      },
      render: ({ dt, still }) => {
        if (!still && dt > 0) {
          // Fixed steps keep the flocking stable whatever the frame rate.
          acc += dt;
          let steps = 0;
          while (acc >= STEP && steps < 4) {
            step(STEP);
            acc -= STEP;
            steps++;
          }
          if (steps === 4) acc = 0;
        }
        render();
      },
    });
    state.loop = loop;

    const local = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = e.pointerType !== "touch";
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      if (!state.interactive || reduceMotion.matches || state.paused) return;
      // Clicks on content (links, buttons, fields) are theirs, not bait.
      if ((e.target as HTMLElement).closest("a, button, input, textarea, select, label, [role=button]")) return;
      const p = local(e);
      baits.push({ x: p.x, y: p.y, t: 0 });
      if (baits.length > 2) baits.shift();
      wake.ring(grid, p.x, p.y, grid.cw * 3, 1.2);
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
  }, [sharkKey, colorKey, schools, fishPerSchool, cell]);

  return (
    <div ref={rootRef} className={cn("relative isolate min-h-96 overflow-hidden font-mono", className)} style={{ background: colors.background, ...style }} {...props}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />
      {children}
    </div>
  );
}
