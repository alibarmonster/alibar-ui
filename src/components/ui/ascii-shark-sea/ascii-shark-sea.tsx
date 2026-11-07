"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { runCanvasLoop, type CanvasLoop } from "@/lib/glyph/canvas-loop";
import { getGlyphAtlas, loadGlyphFont, monoFontFamily, resolveCanvasColors, type GlyphAtlas } from "@/lib/glyph/glyph-atlas";

export type SharkKind = "hammerhead" | "great-white" | "reef";

export interface SharkSpec {
  /** Species: a T-shaped head, a heavy body with a white belly, or a slim body with black fin tips. */
  kind: SharkKind;
  /** Length multiplier. @default 1 */
  size?: number;
}

export interface SharkSeaColors {
  /** Water at the surface (top of the gradient). */
  surface: string;
  /** Water at the bottom. */
  deep: string;
  /** Light rays and surface ripples. */
  ray: string;
  /** Dark back and fins. */
  shark: string;
  /** Flanks. */
  sharkMid: string;
  /** Pale belly and eyes. */
  belly: string;
  /** Black fin tips (reef sharks). */
  finTip: string;
  /** First fish color (schools alternate). */
  fish: string;
  /** Second fish color. */
  fishAlt: string;
  /** Rising bubbles. */
  bubble: string;
  /** Bait dropped with a click. */
  bait: string;
}

export type SharkSeaPalette = "light" | "dark" | (Partial<SharkSeaColors> & { base?: "light" | "dark" });

export interface AsciiSharkSeaProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content above the sea, e.g. a hero. */
  children?: ReactNode;
  /** Sharks on patrol. @default a hammerhead, a great white and a reef shark */
  sharks?: SharkSpec[];
  /** Number of fish schools. @default 3 */
  schools?: number;
  /** Fish in each school. @default 9 */
  fishPerSchool?: number;
  /** Glyph cell size in px. @default 12 */
  cell?: number;
  /** Built-in light or dark colors, or your own (any CSS color). An object starts from `base`. @default "light" */
  palette?: SharkSeaPalette;
  /** Fish avoid the cursor, and a click drops bait that fish and then a shark swim to. @default true */
  interactive?: boolean;
  /** Freezes the sea on its current frame. @default false */
  paused?: boolean;
}

const PALETTES: Record<"light" | "dark", SharkSeaColors> = {
  light: {
    surface: "#eef8f9",
    deep: "#a6d3db",
    ray: "#ffffff",
    shark: "#1b3a4e",
    sharkMid: "#46687b",
    belly: "#7f9fae",
    finTip: "#0b1c27",
    fish: "#e0713a",
    fishAlt: "#d99a1c",
    bubble: "#ffffff",
    bait: "#c2410c",
  },
  dark: {
    surface: "#123047",
    deep: "#040b14",
    ray: "#8fd3e8",
    shark: "#cfe6ee",
    sharkMid: "#7ea2b2",
    belly: "#3a5a6b",
    finTip: "#f4fbfd",
    fish: "#ff9a5c",
    fishAlt: "#ffd166",
    bubble: "#9fdcf0",
    bait: "#ff7a45",
  },
};

const DEFAULT_SHARKS: SharkSpec[] = [{ kind: "hammerhead" }, { kind: "great-white" }, { kind: "reef" }];

/** Order of colors in the atlas. */
const C = { shark: 0, mid: 1, belly: 2, tip: 3, fish: 4, fishAlt: 5, bubble: 6, bait: 7, ray: 8 } as const;
const GLYPHS = [..." .:-=+*#%@/\\|_()o<>~O"];
const DENSE = ["#", "%", "#", "@", "%", "#"];
const MID = ["+", "=", "*", "+", "=", "-"];
const PALE = [":", ".", ":", ".", "-", "."];
const SLOPES = ["-", "\\", "|", "/"];
const SEGMENTS = 14;
const TAU = Math.PI * 2;

/** Species proportions: half-height, fins and speed relative to length. */
const SPECIES: Record<SharkKind, { height: number; dorsal: number; pectoral: number; tail: number; speed: number; gills: boolean; tips: boolean; hammer: boolean }> = {
  hammerhead: { height: 0.125, dorsal: 1.15, pectoral: 0.6, tail: 0.2, speed: 1, gills: true, tips: false, hammer: true },
  "great-white": { height: 0.16, dorsal: 0.95, pectoral: 0.7, tail: 0.17, speed: 0.85, gills: true, tips: false, hammer: false },
  reef: { height: 0.115, dorsal: 1, pectoral: 0.6, tail: 0.2, speed: 1.15, gills: true, tips: true, hammer: false },
};

interface Point {
  x: number;
  y: number;
}

interface Shark {
  kind: SharkKind;
  size: number;
  z: number;
  length: number;
  dir: 1 | -1;
  lane: number;
  laneTimer: number;
  vy: number;
  spine: Point[];
  phase: number;
  seed: number;
  hunting: boolean;
}

interface Fish extends Point {
  vx: number;
  vy: number;
}

interface School {
  fish: Fish[];
  z: number;
  seed: number;
  color: number;
}

interface Bubble extends Point {
  r: number;
  phase: number;
  speed: number;
}

interface Bait extends Point {
  t: number;
}

const hash = (a: number, b = 0, c = 0) => {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Body half-height along the spine, t = 0 at the snout and 1 at the root of the tail. */
function profile(t: number) {
  if (t < 0.14) return 0.28 + (t / 0.14) * 0.6;
  if (t < 0.42) return 0.88 + Math.sin(((t - 0.14) / 0.28) * Math.PI * 0.5) * 0.12;
  return 1 - ((t - 0.42) / 0.58) ** 1.2 * 0.8;
}

/** Point-in-triangle test on (along, up) coordinates. */
function inTriangle(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

const slope = (angle: number) => SLOPES[((Math.round(((angle % Math.PI) + Math.PI) / (Math.PI / 4)) % 4) + 4) % 4];

function resolvePalette(palette: SharkSeaPalette): SharkSeaColors {
  if (palette === "light" || palette === "dark") return PALETTES[palette];
  return { ...PALETTES[palette.base ?? "light"], ...palette };
}

/**
 * A side-view ocean in glyphs: hammerheads, great whites and reef sharks patrol on follow-the-leader
 * spines whose bodies and tails sway, while fish schools flock (separation, alignment, cohesion),
 * scatter from passing sharks and regroup. Fish avoid the cursor; a click drops bait that fish and
 * then a shark come for. Bubbles rise through soft light rays over a depth tint. Glyphs are blitted
 * from a shared atlas; the canvas pauses offscreen and in hidden tabs and holds a still frame under
 * reduced motion.
 */
export function AsciiSharkSea({
  children,
  sharks = DEFAULT_SHARKS,
  schools = 3,
  fishPerSchool = 9,
  cell = 12,
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
  const sharkKey = JSON.stringify(sharks.map((s) => ({ kind: SPECIES[s.kind] ? s.kind : "reef", size: s.size ?? 1 })));
  const live = useRef({ interactive, paused, loop: null as CanvasLoop | null });

  useEffect(() => {
    live.current.interactive = interactive;
    live.current.paused = paused;
    live.current.loop?.wake();
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;

    const state = live.current;
    const specs: SharkSpec[] = JSON.parse(sharkKey);
    const palette: SharkSeaColors = JSON.parse(colorKey);
    const fontFamily = monoFontFamily(root);
    const atlasColors = resolveCanvasColors([palette.shark, palette.sharkMid, palette.belly, palette.finTip, palette.fish, palette.fishAlt, palette.bubble, palette.bait, palette.ray], root);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let atlas: GlyphAtlas | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;
    let seeded = false;
    let disposed = false;
    const fleet: Shark[] = [];
    const flock: School[] = [];
    const bubbles: Bubble[] = [];
    const baits: Bait[] = [];
    const pointer = { x: -1e4, y: -1e4, inside: false };
    const gi = (glyph: string) => atlas?.index(glyph) ?? -1;

    const buildAtlas = () => {
      atlas = getGlyphAtlas({ glyphs: GLYPHS, colors: atlasColors, cell, dpr, fontFamily, fontWeight: 600, fontScale: 0.9 });
    };

    /* ------------------------------------------------------------ setup */

    const sharkLength = (s: Pick<Shark, "size" | "z">) => Math.min(width * 0.8, cell * 30 * s.size) * (0.6 + 0.4 * s.z);

    const layout = (s: Shark, headX: number, headY: number) => {
      const step = s.length / SEGMENTS;
      s.spine = Array.from({ length: SEGMENTS + 1 }, (_, k) => ({ x: headX - s.dir * step * k, y: headY }));
    };

    const seed = () => {
      seeded = true;
      specs.forEach((spec, i) => {
        const z = 0.35 + hash(i, 11) * 0.65;
        const s: Shark = {
          kind: spec.kind,
          size: Math.max(0.4, Math.min(2.5, spec.size ?? 1)),
          z,
          length: 0,
          dir: hash(i, 12) > 0.5 ? 1 : -1,
          lane: height * (0.25 + ((i + 0.5) / Math.max(1, specs.length)) * 0.55),
          laneTimer: 4 + hash(i, 13) * 6,
          vy: 0,
          spine: [],
          phase: hash(i, 14) * TAU,
          seed: 100 + i * 37,
          hunting: false,
        };
        s.length = sharkLength(s);
        const x = width * (0.18 + ((i * 0.37 + hash(i, 15) * 0.2) % 1) * 0.7);
        layout(s, x, s.lane);
        fleet.push(s);
      });
      fleet.sort((a, b) => a.z - b.z);
      for (let k = 0; k < schools; k++) {
        const home = { x: width * (0.2 + hash(k, 21) * 0.6), y: height * (0.3 + hash(k, 22) * 0.45) };
        const fish = Array.from({ length: fishPerSchool }, (_, f) => ({
          x: home.x + (hash(k, f, 23) - 0.5) * cell * 8,
          y: home.y + (hash(k, f, 24) - 0.5) * cell * 4,
          vx: (hash(k, f, 25) - 0.3) * 30,
          vy: (hash(k, f, 26) - 0.5) * 10,
        }));
        flock.push({ fish, z: 0.4 + hash(k, 27) * 0.6, seed: 300 + k * 41, color: k % 2 ? C.fishAlt : C.fish });
      }
      for (let b = 0; b < 14; b++) bubbles.push({ x: hash(b, 31) * width, y: hash(b, 32) * height, r: hash(b, 33), phase: hash(b, 34) * TAU, speed: 18 + hash(b, 35) * 24 });
    };

    /* ------------------------------------------------------------ simulation */

    const steerShark = (s: Shark, dt: number) => {
      const head = s.spine[0];
      const sp = SPECIES[s.kind];
      s.laneTimer -= dt;
      const bait = s.hunting ? baits[0] : undefined;
      if (bait) s.lane = bait.y;
      else if (s.laneTimer <= 0) {
        s.laneTimer = 6 + hash(s.seed, Math.floor(time)) * 8;
        s.lane = height * (0.18 + hash(s.seed, Math.floor(time), 2) * 0.66);
      }
      const speed = cell * 3.4 * sp.speed * (0.6 + 0.4 * s.z) * (bait ? 1.9 : 1);
      const targetVy = Math.max(-speed * 0.45, Math.min(speed * 0.45, (s.lane - head.y) * 0.8));
      s.vy += (targetVy - s.vy) * Math.min(1, dt * 1.5);
      head.x += s.dir * speed * dt;
      head.y += s.vy * dt;
      // Turn around once the whole body is past the edge, maybe at a new depth.
      const margin = s.length * 1.15;
      if ((s.dir > 0 && head.x > width + margin) || (s.dir < 0 && head.x < -margin)) {
        s.dir = s.dir > 0 ? -1 : 1;
        if (!s.hunting) {
          s.z = 0.35 + hash(s.seed, Math.floor(time), 5) * 0.65;
          s.length = sharkLength(s);
          s.lane = height * (0.18 + hash(s.seed, Math.floor(time), 6) * 0.66);
          fleet.sort((a, b) => a.z - b.z);
        }
      }
      const step = s.length / SEGMENTS;
      for (let k = 1; k < s.spine.length; k++) {
        const a = s.spine[k - 1];
        const b = s.spine[k];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        b.x = a.x + (dx / d) * step;
        b.y = a.y + (dy / d) * step;
      }
      if (bait && Math.hypot(bait.x - head.x, bait.y - head.y) < Math.max(cell * 1.6, s.length * SPECIES[s.kind].height * 1.2)) {
        baits.shift();
        s.hunting = false;
        for (let b = 0; b < 8; b++) bubbles.push({ x: bait.x + (hash(b, time * 100) - 0.5) * cell * 2, y: bait.y, r: 0.2 + hash(b, 41, time * 10) * 0.8, phase: hash(b, 42) * TAU, speed: 30 + hash(b, 43) * 30 });
      }
    };

    const stepSchool = (school: School, dt: number) => {
      const home = {
        x: width * (0.5 + 0.38 * Math.sin(time * 0.045 + school.seed)),
        y: height * (0.28 + 0.5 * (0.5 + 0.5 * Math.sin(time * 0.06 + school.seed * 2))),
      };
      const bait = baits[0];
      for (const f of school.fish) {
        let ax = (home.x - f.x) * 0.15;
        let ay = (home.y - f.y) * 0.2;
        let sx = 0;
        let sy = 0;
        let cx = 0;
        let cy = 0;
        let vx = 0;
        let vy = 0;
        let n = 0;
        for (const o of school.fish) {
          if (o === f) continue;
          const dx = f.x - o.x;
          const dy = f.y - o.y;
          const d = Math.hypot(dx, dy);
          if (d > cell * 7) continue;
          n++;
          cx += o.x;
          cy += o.y;
          vx += o.vx;
          vy += o.vy;
          // Fish are three cells wide, so keep more room side to side than above and below.
          const room = Math.hypot(dx / 3.6, dy / 1.6);
          if (room < cell && d > 0) {
            sx += (dx / d) * (cell - room) * 2;
            sy += (dy / d) * (cell - room) * 2;
          }
        }
        if (n) {
          ax += (cx / n - f.x) * 0.9 + (vx / n - f.vx) * 0.8;
          ay += (cy / n - f.y) * 0.9 + (vy / n - f.vy) * 0.8;
        }
        ax += sx * 6;
        ay += sy * 6;
        let fleeing = false;
        for (const s of fleet) {
          // Body points: head, middle and tail.
          for (const k of [0, SEGMENTS >> 1, SEGMENTS]) {
            const p = s.spine[k];
            const dx = f.x - p.x;
            const dy = f.y - p.y;
            const d = Math.hypot(dx, dy) || 1;
            const reach = cell * 6 + s.length * 0.3;
            if (d < reach) {
              const push = (1 - d / reach) * 900;
              ax += (dx / d) * push;
              ay += (dy / d) * push;
              fleeing = true;
            }
          }
        }
        if (pointer.inside && live.current.interactive) {
          const dx = f.x - pointer.x;
          const dy = f.y - pointer.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < cell * 8) {
            const push = (1 - d / (cell * 8)) * 700;
            ax += (dx / d) * push;
            ay += (dy / d) * push;
            fleeing = true;
          }
        }
        if (bait && !fleeing) {
          const dx = bait.x - f.x;
          const dy = bait.y - f.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < cell * 24) {
            ax += (dx / d) * 160 - f.vx * 0.5;
            ay += (dy / d) * 160 - f.vy * 0.5;
          }
        }
        // Soft walls.
        if (f.x < cell * 2) ax += 200;
        if (f.x > width - cell * 2) ax -= 200;
        if (f.y < cell * 3) ay += 200;
        if (f.y > height - cell * 2) ay -= 200;
        f.vx += ax * dt;
        f.vy += ay * dt;
        const max = (fleeing ? 9 : 4.2) * cell * (0.7 + 0.3 * school.z);
        const v = Math.hypot(f.vx, f.vy);
        if (v > max) {
          f.vx *= max / v;
          f.vy *= max / v;
        }
        // Fish mostly swim level.
        f.vy *= 1 - Math.min(1, dt * 1.2);
        f.x += f.vx * dt;
        f.y += f.vy * dt;
      }
    };

    const step = (dt: number) => {
      time += dt;
      for (const s of fleet) steerShark(s, dt);
      for (const school of flock) stepSchool(school, dt);
      for (const b of bubbles) {
        b.y -= b.speed * dt;
        b.x += Math.sin(time * 2 + b.phase) * dt * 6;
        b.r = Math.min(1, b.r + dt * 0.05);
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        if (bubbles[i].y < cell * 1.5) {
          if (bubbles.length > 14) bubbles.splice(i, 1);
          else {
            bubbles[i].y = height + cell;
            bubbles[i].x = hash(i, Math.floor(time * 10)) * width;
            bubbles[i].r = hash(i, Math.floor(time * 10), 1) * 0.5;
          }
        }
      }
      for (let i = baits.length - 1; i >= 0; i--) {
        const bait = baits[i];
        bait.t += dt;
        bait.y = Math.min(height - cell, bait.y + cell * 1.1 * dt);
        bait.x += Math.sin(time * 1.6 + i) * dt * 4;
        if (bait.t > 16) baits.splice(i, 1);
      }
      // After a moment, the nearest shark heading toward the bait comes for it.
      const bait = baits[0];
      if (bait && bait.t > 1.2 && !fleet.some((s) => s.hunting)) {
        let best: Shark | null = null;
        let bestScore = Infinity;
        for (const s of fleet) {
          const head = s.spine[0];
          const ahead = Math.sign(bait.x - head.x) === s.dir;
          const score = Math.hypot(bait.x - head.x, bait.y - head.y) * (ahead ? 1 : 3);
          if (score < bestScore) {
            bestScore = score;
            best = s;
          }
        }
        if (best) best.hunting = true;
      }
      if (!bait) for (const s of fleet) s.hunting = false;
    };

    /* ------------------------------------------------------------ drawing */

    const put = (gx: number, gy: number, glyph: string, color: number, scale = 1) => {
      if (!atlas) return;
      atlas.draw(ctx, gi(glyph), color, gx * cell, gy * cell, scale);
    };

    const drawShark = (s: Shark) => {
      const sp = SPECIES[s.kind];
      const L = s.length;
      const H = L * sp.height;
      const tailLen = L * sp.tail;
      const spine = s.spine;
      const segLen = L / SEGMENTS;
      const swim = time * 3.2 + s.phase;
      const sway = (t: number) => Math.sin(swim - t * 5) * H * 0.22 * Math.min(1.4, t) ** 2;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of spine) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      const pad = Math.max(H * 2.8, tailLen * 1.2) + cell;
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const gx0 = Math.max(0, Math.floor((minX - pad) / cell));
      const gx1 = Math.min(cols - 1, Math.floor((maxX + pad) / cell));
      const gy0 = Math.max(0, Math.floor((minY - pad) / cell));
      const gy1 = Math.min(rows - 1, Math.floor((maxY + pad) / cell));
      if (gx0 > gx1 || gy0 > gy1) return;
      ctx.globalAlpha = 0.42 + 0.58 * s.z;
      const dorsalTop = H * (1 + sp.dorsal);
      const eye = { t: sp.hammer ? 0.02 : 0.075, v: sp.hammer ? H * 1.45 : H * 0.32 };
      let eyeCell: [number, number] | null = null;
      let eyeDist = Infinity;
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const px = gx * cell + cell / 2;
          const py = gy * cell + cell / 2;
          // Nearest point on the (swaying) spine, allowing the last segment to run on into the tail.
          let best = Infinity;
          let bestT = 0;
          let bestV = 0;
          let bestAngle = 0;
          for (let k = 0; k < SEGMENTS; k++) {
            const a = spine[k];
            const b = spine[k + 1];
            const abx = b.x - a.x;
            const aby = b.y - a.y;
            const len = Math.hypot(abx, aby) || 1;
            let u = ((px - a.x) * abx + (py - a.y) * aby) / (len * len);
            if (k === 0 && u < -0.5 / SEGMENTS) continue;
            u = Math.min(k === SEGMENTS - 1 ? 1 + tailLen / segLen : 1, Math.max(0, u));
            const t = (k + u) / SEGMENTS;
            // Upward normal, whichever way the shark faces.
            let nx = -aby / len;
            let ny = abx / len;
            if (ny > 0) {
              nx = -nx;
              ny = -ny;
            }
            const off = sway(t);
            const cx = a.x + abx * u + nx * off;
            const cy = a.y + aby * u + ny * off;
            const d = Math.hypot(px - cx, py - cy);
            if (d < best) {
              best = d;
              bestT = t;
              bestV = (px - cx) * nx + (py - cy) * ny;
              bestAngle = Math.atan2(aby, abx);
            }
          }
          if (best > pad) continue;
          const t = bestT;
          const v = bestV;
          const along = t * L;
          let glyph = "";
          let color: number = C.shark;
          if (t <= 1) {
            const h = H * profile(t);
            if (Math.abs(v) <= h) {
              const n = v / h;
              const k = hash(Math.round(t * 40), Math.round(n * 3), s.seed);
              if (sp.gills && t > 0.17 && t < 0.28 && Math.abs(n) < 0.55 && Math.round(t * 100) % 4 === 0) {
                glyph = s.dir > 0 ? ")" : "(";
                color = C.shark;
              } else if (Math.abs(n) > 0.84) {
                glyph = n > 0 ? slope(bestAngle) : "_";
                color = n > 0 ? C.shark : C.mid;
              } else if (n > 0.3) glyph = DENSE[Math.floor(k * DENSE.length)];
              else if (n > -0.2) {
                glyph = MID[Math.floor(k * MID.length)];
                color = C.mid;
              } else {
                glyph = PALE[Math.floor(k * PALE.length)];
                color = C.belly;
              }
            } else if (inTriangle(along, v, 0.3 * L, H * profile(0.3) * 0.85, 0.41 * L, dorsalTop, 0.49 * L, H * profile(0.49) * 0.85)) {
              glyph = "#";
              color = sp.tips && v > dorsalTop - H * sp.dorsal * 0.35 ? C.tip : C.shark;
            } else if (inTriangle(along, v, 0.21 * L, -H * profile(0.21) * 0.8, 0.36 * L, -H * (1 + sp.pectoral), 0.31 * L, -H * profile(0.31) * 0.8)) {
              glyph = "%";
              color = sp.tips && v < -H * (1 + sp.pectoral * 0.6) ? C.tip : C.mid;
            } else if (sp.hammer && along < L * 0.06 && Math.abs(v) <= H * 1.6) {
              glyph = "#";
            }
          } else {
            // The tail: a tall upper lobe and a shorter lower one.
            const x = (t - 1) * L;
            const upper = inTriangle(x, v, 0, H * 0.22, tailLen, H * 1.55, tailLen * 0.42, -H * 0.05);
            const lower = inTriangle(x, v, 0, -H * 0.22, tailLen * (s.kind === "great-white" ? 0.85 : 0.65), -H * (s.kind === "great-white" ? 1.25 : 0.95), tailLen * 0.35, H * 0.05);
            if (upper || lower) {
              glyph = upper ? "%" : "#";
              color = sp.tips && x > tailLen * 0.62 ? C.tip : C.shark;
            }
          }
          if (!glyph) continue;
          put(gx, gy, glyph, color);
          // The eye sits on the cell nearest its spot on the head.
          const de = Math.hypot(t - eye.t, (v - eye.v) / L);
          if (de < eyeDist && t < 0.15) {
            eyeDist = de;
            eyeCell = [gx, gy];
          }
        }
      }
      if (eyeCell && atlas) {
        // Clear the cell under the eye so the glyph reads.
        ctx.clearRect(eyeCell[0] * cell, eyeCell[1] * cell, cell, cell);
        put(eyeCell[0], eyeCell[1], "o", C.belly);
      }
      ctx.globalAlpha = 1;
    };

    const drawSchool = (school: School) => {
      ctx.globalAlpha = 0.45 + 0.55 * school.z;
      for (const f of school.fish) {
        const gx = Math.round(f.x / cell);
        const gy = Math.round(f.y / cell);
        const right = f.vx >= 0;
        put(gx - 1, gy, right ? ">" : "<", school.color);
        put(gx, gy, right ? "<" : ">", school.color);
        put(gx + 1, gy, right ? ">" : "<", school.color);
      }
      ctx.globalAlpha = 1;
    };

    const drawRays = () => {
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const x = width * (0.12 + i * 0.27) + Math.sin(time * 0.25 + i * 1.7) * width * 0.04;
        const w = width * (0.05 + hash(i, 51) * 0.06);
        const skew = height * 0.45;
        const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.9);
        gradient.addColorStop(0, atlasColors[C.ray]);
        gradient.addColorStop(1, "transparent");
        ctx.globalAlpha = 0.16 + 0.06 * Math.sin(time * 0.5 + i);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + w, 0);
        ctx.lineTo(x + w * 2.2 + skew * 0.35, height * 0.9);
        ctx.lineTo(x + skew * 0.35, height * 0.9);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    const render = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!atlas || !seeded) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRays();
      // Surface ripples.
      ctx.globalAlpha = 0.7;
      const cols = Math.ceil(width / cell);
      for (let gx = 0; gx < cols; gx++) if (Math.sin(gx * 0.55 + time * 1.8) + Math.sin(gx * 0.21 - time) > 0.4) put(gx, 0, "~", C.ray);
      ctx.globalAlpha = 1;
      // Far to near: sharks and schools interleaved by depth.
      const layers: { z: number; draw: () => void }[] = [...fleet.map((s) => ({ z: s.z, draw: () => drawShark(s) })), ...flock.map((f) => ({ z: f.z, draw: () => drawSchool(f) }))];
      layers.sort((a, b) => a.z - b.z);
      for (const layer of layers) layer.draw();
      ctx.globalAlpha = 0.8;
      for (const b of bubbles) put(Math.round(b.x / cell), Math.round(b.y / cell), b.r < 0.35 ? "." : b.r < 0.75 ? "o" : "O", C.bubble);
      ctx.globalAlpha = 1;
      for (const bait of baits) put(Math.round(bait.x / cell), Math.round(bait.y / cell), "*", C.bait, 1.2);
    };

    const loop = runCanvasLoop({
      host: root,
      canvas,
      isPaused: () => live.current.paused,
      resize: (frame) => {
        width = frame.width;
        height = frame.height;
        dpr = frame.dpr;
        buildAtlas();
        if (!seeded) seed();
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
      const p = local(e);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    const onDown = (e: PointerEvent) => {
      if (!live.current.interactive || reduceMotion.matches || live.current.paused) return;
      // Clicks on content (links, buttons, fields) are theirs, not bait.
      if ((e.target as HTMLElement).closest("a, button, input, textarea, select, label, [role=button]")) return;
      const p = local(e);
      baits.push({ x: p.x, y: p.y, t: 0 });
      if (baits.length > 3) baits.shift();
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
    <div
      ref={rootRef}
      className={cn("relative isolate min-h-96 overflow-hidden font-mono", className)}
      style={{ background: `linear-gradient(to bottom, ${colors.surface}, ${colors.deep})`, ...style }}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />
      {children}
    </div>
  );
}
