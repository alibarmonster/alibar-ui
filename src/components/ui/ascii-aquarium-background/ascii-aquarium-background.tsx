"use client";

import { useEffect, useImperativeHandle, useRef, type ComponentProps, type CSSProperties, type Ref, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { hash3, WakeField } from "@/lib/glyph/ascii-life";

export type AquariumMode = "idle" | "listening" | "thinking";

export interface AquariumColors {
  /** Page color behind the grid. */
  background: string;
  /** Grid line color. */
  grid: string;
  /** Glyph color for creatures, specks and ripples. */
  ink: string;
  /** Color of the hero creature and the click burst. */
  accent: string;
}

export type AquariumPalette = "light" | "dark" | (Partial<AquariumColors> & { base?: "light" | "dark" });

export interface AquariumCreatures {
  /** Rays. The first ray is the hero. @default 1 */
  rays?: number;
  /** Jellyfish. @default 3 */
  jellyfish?: number;
  /** Fish schools. @default 2 */
  schools?: number;
  /** Fish in each school. @default 7 */
  fishPerSchool?: number;
}

export interface AsciiAquariumHandle {
  /** Switches mode without a re-render. The `mode` prop takes over again the next time it changes. */
  setMode: (mode: AquariumMode) => void;
  /** Drops a ripple at a viewport point, e.g. from a pointer event's clientX/clientY. */
  ripple: (clientX: number, clientY: number) => void;
}

export interface AsciiAquariumBackgroundProps extends Omit<ComponentProps<"div">, "ref"> {
  /** Cell size in px. Leave it unset for 9, 11 or 12px by viewport width. Either way it's written to `--cell`, which sizes the grid and the glyphs. */
  cell?: number;
  /** How many of each creature to draw. The hero is the first ray, or the first jellyfish or school if there are no rays. */
  creatures?: AquariumCreatures;
  /** Built-in light or dark colors, or your own (any CSS color, including `var()`). An object starts from `base`. @default "light" */
  palette?: AquariumPalette;
  /** Element the hero orbits while listening or thinking, such as a chat input. Typing inside it excites the hero. Without it, the hero orbits the center. */
  focusRef?: RefObject<HTMLElement | null>;
  /** idle: the hero wanders and drifts toward the cursor. listening: it slowly orbits `focusRef`. thinking: it orbits faster. @default "idle" */
  mode?: AquariumMode;
  /** Cursor following and click ripples on empty background. @default true */
  interactive?: boolean;
  /** Adds a particle burst to each click ripple. @default true */
  burst?: boolean;
  /** Freezes the scene on its current frame. @default false */
  paused?: boolean;
  /** Imperative handle with `setMode()` and `ripple()`. */
  ref?: Ref<AsciiAquariumHandle>;
}

type Kind = "ray" | "jelly" | "school";

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  ox: number;
  oy: number;
  seed: number;
  phase: number;
}

interface Creature {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  /** Depth from 0 (far) to 1 (near): far creatures are smaller, fainter and lighter. */
  z: number;
  /** Size relative to the grid, so creatures scale when the container resizes. */
  rel: number;
  size: number;
  radius: number;
  seed: number;
  phase: number;
  hero: boolean;
  members: Fish[];
}

interface Speck {
  dx: number;
  dy: number;
  freq: number;
  phase: number;
  accent: boolean;
}

interface Cluster {
  x: number;
  y: number;
  age: number;
  life: number;
  specks: Speck[];
}

interface Ripple {
  x: number;
  y: number;
  age: number;
  max: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
}

const TAU = Math.PI * 2;
const PALETTES: Record<"light" | "dark", AquariumColors> = {
  light: { background: "#FFFFFF", grid: "rgba(9, 9, 11, 0.06)", ink: "#09090B", accent: "#2563EB" },
  dark: { background: "#09090B", grid: "rgba(250, 250, 250, 0.07)", ink: "#FAFAFA", accent: "#60A5FA" },
};

// Brightness ramps, densest first. Shading in the low-res buffer picks the set, then the glyph within it.
const DARK = "@#%&8";
const MID = "*xo+=";
const LIGHT = "~-;:";
const LINES = "-\\|/";
const SPARK = "*+.";
const GLYPHS = Array.from(new Set(DARK + MID + LIGHT + LINES + SPARK)).join("");
const glyphIndex = (chars: string) => Array.from(chars, (ch) => GLYPHS.indexOf(ch));
const DARK_I = glyphIndex(DARK);
const MID_I = glyphIndex(MID);
const LIGHT_I = glyphIndex(LIGHT);
const LINES_I = glyphIndex(LINES);
const SPARK_I = glyphIndex(SPARK);
/** Rows of the glyph atlas, mixing ink (0) into accent (TINTS - 1). */
const TINTS = 5;
const ALPHA_SKIP = 0.08;
const ALPHA_EDGE = 0.38;
const IGNORE = "a, button, input, textarea, select, label, summary, [role='button'], [contenteditable='true'], [data-aquarium-ignore]";

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const randInt = (lo: number, hi: number) => Math.floor(rand(lo, hi + 1));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const angleDiff = (a: number, b: number) => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};

function hash1(n: number) {
  let h = Math.imul(n | 0, 374761393) ^ 0x2c1b3c6d;
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** Smooth 1D gradient noise in roughly [-1, 1]. */
function noise1(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const a = (hash1(i) * 2 - 1) * f;
  const b = (hash1(i + 1) * 2 - 1) * (f - 1);
  return (a + (b - a) * f * f * (3 - 2 * f)) * 2;
}

/** Picks - \ | / for a line running perpendicular to `normal` (radians, screen space with y down). */
const lineGlyph = (normal: number) => {
  const tangent = (((normal + Math.PI / 2) % Math.PI) + Math.PI) % Math.PI;
  const bucket = tangent < Math.PI / 8 || tangent >= (7 * Math.PI) / 8 ? 0 : tangent < (3 * Math.PI) / 8 ? 1 : tangent < (5 * Math.PI) / 8 ? 2 : 3;
  return LINES_I[bucket];
};

function resolvePalette(palette: AquariumPalette | undefined): AquariumColors {
  if (!palette || palette === "light" || palette === "dark") return PALETTES[palette ?? "light"];
  const { base = "light", ...rest } = palette;
  const custom = Object.fromEntries(Object.entries(rest).filter(([, value]) => Boolean(value)));
  return { ...PALETTES[base], ...custom };
}

/** Resolves any CSS color (including var() and oklch) to RGB by letting the browser compute it, then painting one pixel. */
function resolveColor(el: HTMLElement, probe: CanvasRenderingContext2D, value: string): [number, number, number] {
  el.style.color = value;
  const computed = getComputedStyle(el).color;
  el.style.color = "";
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = computed;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function pickGlyph(set: number[], fraction: number) {
  return set[Math.min(set.length - 1, Math.max(0, Math.floor(fraction * set.length)))];
}

/**
 * A grid-paper aquarium drawn in glyphs. Creatures are painted as soft shapes onto a tiny canvas where
 * one pixel is one cell, then every cell is read back and stamped with a pre-rendered glyph.
 */
export function AsciiAquariumBackground({
  cell,
  creatures,
  palette = "light",
  focusRef,
  mode = "idle",
  interactive = true,
  burst = true,
  paused = false,
  ref,
  className,
  style,
  children,
  ...props
}: AsciiAquariumBackgroundProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<AquariumMode>(mode);
  const api = useRef<{ run: () => void; ripple: (x: number, y: number) => void } | null>(null);
  const colors = resolvePalette(palette);
  const paletteKey = `${colors.ink}|${colors.accent}`;
  const creaturesKey = JSON.stringify(creatures ?? {});
  const latest = useRef({ creatures, paletteKey, colors, focusRef, interactive, burst, paused, creaturesKey });

  useEffect(() => {
    latest.current = { creatures, paletteKey, colors, focusRef, interactive, burst, paused, creaturesKey };
  });

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!paused) api.current?.run();
  }, [paused]);

  useImperativeHandle(
    ref,
    () => ({
      setMode: (next) => {
        modeRef.current = next;
      },
      ripple: (x, y) => api.current?.ripple(x, y),
    }),
    [],
  );

  useEffect(() => {
    const host = root.current;
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    const low = document.createElement("canvas");
    const lctx = low.getContext("2d", { willReadFrequently: true });
    const probeCanvas = document.createElement("canvas");
    probeCanvas.width = 1;
    probeCanvas.height = 1;
    const probe = probeCanvas.getContext("2d", { willReadFrequently: true });
    if (!host || !el || !ctx || !lctx || !probe) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let cellPx = 12;
    let cols = 0;
    let rows = 0;
    let dpr = 1;
    let glyphPx = 12;
    let atlas: HTMLCanvasElement | null = null;
    let tints: string[] = [];
    let paletteKey = "";
    let creaturesKey = "";
    let fontKey = "";
    let list: Creature[] = [];
    let drawOrder: Creature[] = [];
    let clusters: Cluster[] = [];
    const ripples: Ripple[] = [];
    let particles: Particle[] = [];
    let overlay = new Int16Array(0);
    let overlayAlpha = new Float32Array(0);
    let overlayTint = new Uint8Array(0);
    // Energy left where creatures swim; it spreads, fades and lights dots in the empty water.
    let wake = new WakeField(1, 1);
    let accentRgb = "37, 99, 235";
    let t = 0;
    let clock = 0;
    let last = 0;
    let raf = 0;
    let visible = true;
    let disposed = false;
    let currentMode: AquariumMode = modeRef.current;
    let orbitAngle = 0;
    let energy = 0;
    let typingTarget: HTMLElement | null = null;
    const pointer = { x: 0, y: 0, active: false, at: -10 };

    const onTyping = () => {
      energy = Math.min(1.6, energy + 0.45);
      run();
    };

    // --- palette and glyph atlas -------------------------------------------------------------
    const paintAtlas = () => {
      const family = getComputedStyle(el).fontFamily || "ui-monospace, monospace";
      const font = `500 ${Math.round(glyphPx * 0.94)}px ${family}`;
      const sheet = atlas ?? document.createElement("canvas");
      sheet.width = glyphPx * GLYPHS.length;
      sheet.height = glyphPx * TINTS;
      const a = sheet.getContext("2d");
      if (!a) return font;
      a.font = font;
      a.textAlign = "center";
      a.textBaseline = "middle";
      tints.forEach((tint, row) => {
        a.fillStyle = tint;
        for (let i = 0; i < GLYPHS.length; i++) a.fillText(GLYPHS[i], i * glyphPx + glyphPx / 2, row * glyphPx + glyphPx * 0.54);
      });
      atlas = sheet;
      return font;
    };

    // Every glyph in every tint is drawn once here; frames only copy them with drawImage.
    const buildAtlas = () => {
      const font = paintAtlas();
      fontKey = font;
      // A web font that hasn't loaded yet draws as a fallback, so repaint once it arrives.
      document.fonts?.load(font).then(
        () => {
          if (disposed || fontKey !== font) return;
          paintAtlas();
          if (!raf) render();
        },
        () => {},
      );
    };

    const applyPalette = () => {
      const { colors } = latest.current;
      paletteKey = latest.current.paletteKey;
      const ink = resolveColor(el, probe, colors.ink);
      const accent = resolveColor(el, probe, colors.accent);
      accentRgb = accent.join(", ");
      tints = Array.from({ length: TINTS }, (_, k) => {
        const f = k / (TINTS - 1);
        const mix = (i: number) => Math.round(ink[i] + (accent[i] - ink[i]) * f);
        return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
      });
      buildAtlas();
    };

    // --- creatures ----------------------------------------------------------------------------
    const spawn = () => {
      creaturesKey = latest.current.creaturesKey;
      const { rays = 1, jellyfish = 3, schools = 2, fishPerSchool = 7 } = latest.current.creatures ?? {};
      const make = (kind: Kind, rel: number, z: number): Creature => {
        const angle = rand(0, TAU);
        return {
          kind,
          x: rand(0.12, 0.88) * cols,
          y: kind === "jelly" ? rand(0.2, 1) * rows : rand(0.15, 0.85) * rows,
          vx: Math.cos(angle),
          vy: Math.sin(angle) * 0.5,
          heading: angle,
          z,
          rel,
          size: 0,
          radius: 0,
          seed: rand(0, 1000),
          phase: rand(0, 1),
          hero: false,
          members: [],
        };
      };
      list = [];
      for (let i = 0; i < clamp(Math.round(rays), 0, 4); i++) list.push(make("ray", i === 0 ? 0.46 : rand(0.26, 0.34), i === 0 ? 1 : rand(0.6, 0.82)));
      for (let i = 0; i < clamp(Math.round(jellyfish), 0, 12); i++) list.push(make("jelly", rand(0.065, 0.09), rand(0.55, 0.95)));
      const perSchool = clamp(Math.round(fishPerSchool), 1, 16);
      for (let i = 0; i < clamp(Math.round(schools), 0, 6); i++) {
        const school = make("school", rand(0.13, 0.17) * (0.7 + perSchool * 0.05), rand(0.6, 0.92));
        for (let k = 0; k < perSchool; k++) {
          school.members.push({
            x: school.x,
            y: school.y,
            vx: 0,
            vy: 0,
            heading: school.heading,
            ox: rand(-1, 1),
            oy: rand(-1, 1),
            seed: rand(0, 1000),
            phase: rand(0, TAU),
          });
        }
        list.push(school);
      }
      const hero = list.find((c) => c.kind === "ray") ?? list[0];
      if (hero) {
        hero.hero = true;
        hero.z = 1;
      }
      sizeCreatures();
      // Spread creatures out so they don't start on top of each other.
      for (let pass = 0; pass < 24; pass++) {
        for (const a of list) {
          for (const b of list) {
            if (a === b) continue;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d = Math.hypot(dx, dy) || 1;
            const min = (a.radius + b.radius) * 0.8;
            if (d < min) {
              a.x = clamp(a.x + (dx / d) * (min - d) * 0.5, 0, cols);
              a.y = clamp(a.y + (dy / d) * (min - d) * 0.5, 0, rows);
            }
          }
        }
      }
      for (const c of list) for (const f of c.members) Object.assign(f, { x: c.x + f.ox * c.size, y: c.y + f.oy * c.size * 0.6 });
      drawOrder = [...list].sort((a, b) => a.z - b.z);
    };

    const sizeCreatures = () => {
      const unit = Math.min(cols, rows * 1.8);
      for (const c of list) {
        if (c.kind === "ray") c.size = clamp(unit * c.rel, 12, 44);
        else if (c.kind === "jelly") c.size = clamp(unit * c.rel, 2.4, 6.5);
        else c.size = clamp(unit * c.rel, 6, 15);
        c.radius = c.size * (c.kind === "ray" ? 0.42 : c.kind === "jelly" ? 1.3 : 0.7);
      }
    };

    const newCluster = (initial: boolean): Cluster => {
      const life = rand(7, 14);
      return {
        x: rand(0, cols),
        y: rand(0, rows),
        life,
        age: initial ? rand(0, life) : 0,
        specks: Array.from({ length: randInt(3, 7) }, () => ({
          dx: randInt(-3, 3),
          dy: randInt(-2, 2),
          freq: rand(0.5, 1.4),
          phase: rand(0, TAU),
          accent: Math.random() < 0.12,
        })),
      };
    };

    // --- layout -------------------------------------------------------------------------------
    const measure = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      const nextCell = parseFloat(getComputedStyle(host).getPropertyValue("--cell")) || 12;
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      if (w === width && h === height && nextCell === cellPx && nextDpr === dpr) return;
      const oldCols = cols;
      const oldRows = rows;
      width = w;
      height = h;
      cellPx = nextCell;
      dpr = nextDpr;
      cols = Math.max(1, Math.ceil(w / cellPx));
      rows = Math.max(1, Math.ceil(h / cellPx));
      el.width = Math.max(1, Math.round(w * dpr));
      el.height = Math.max(1, Math.round(h * dpr));
      low.width = cols;
      low.height = rows;
      overlay = new Int16Array(cols * rows);
      overlayAlpha = new Float32Array(cols * rows);
      overlayTint = new Uint8Array(cols * rows);
      wake = new WakeField(cols, rows);
      if (oldCols && list.length) {
        const sx = cols / oldCols;
        const sy = rows / oldRows;
        for (const c of list) {
          c.x *= sx;
          c.y *= sy;
          for (const f of c.members) {
            f.x *= sx;
            f.y *= sy;
          }
        }
        sizeCreatures();
      } else {
        spawn();
      }
      clusters = Array.from({ length: clamp(Math.round((cols * rows) / 700), 3, 28) }, () => newCluster(true));
      const nextGlyph = Math.max(4, Math.round(cellPx * dpr));
      if (nextGlyph !== glyphPx || !atlas) {
        glyphPx = nextGlyph;
        if (tints.length) buildAtlas();
      }
    };

    // --- simulation ---------------------------------------------------------------------------
    const focusGeometry = (hero: Creature) => {
      const target = latest.current.focusRef?.current;
      let x = cols / 2;
      let y = rows / 2;
      let wantX = Math.max(8, cols * 0.3);
      let wantY = Math.max(6, rows * 0.28);
      if (target) {
        const box = host.getBoundingClientRect();
        const r = target.getBoundingClientRect();
        x = (r.left + r.width / 2 - box.left) / cellPx;
        y = (r.top + r.height / 2 - box.top) / cellPx;
        wantY = Math.max(r.height / 2 / cellPx + hero.size * 0.36, 7);
        wantX = Math.max(r.width / 2 / cellPx + hero.size * 0.3, wantY * 1.4);
      }
      // Fit the orbit in the room around the focus point so the wingtips stay in view. Around an input
      // nearly as wide as the container, the hero passes behind the input's ends instead of off the sides.
      const ry = clamp(wantY, 4, Math.max(4, Math.min(y, rows - y) - hero.size * 0.3));
      const rx = clamp(wantX, ry, Math.max(ry, Math.min(x, cols - x) - hero.size * 0.5));
      return { x, y, rx: rx * (1 - energy * 0.05), ry: ry * (1 - energy * 0.08) };
    };

    const step = (dt: number) => {
      const slow = reduce.matches ? 0.3 : 1;
      const sdt = dt * slow;
      t += sdt;
      clock += dt;
      energy = Math.max(0, energy - dt * 1.1);
      const nextMode = modeRef.current;
      const hero = list.find((c) => c.hero);
      if (nextMode !== currentMode) {
        if (hero && currentMode === "idle") {
          const f = focusGeometry(hero);
          orbitAngle = Math.atan2((hero.y - f.y) / f.ry, (hero.x - f.x) / f.rx);
        }
        currentMode = nextMode;
      }
      const thinking = currentMode === "thinking";
      const focus = currentMode !== "idle" && hero ? focusGeometry(hero) : null;
      let omega = 0;
      if (focus) {
        omega = (thinking ? 1.05 : 0.36) * (1 + energy * 0.9);
        orbitAngle += omega * sdt;
      }
      const { interactive } = latest.current;
      const following = interactive && pointer.active && clock - pointer.at < 4;

      for (const c of list) {
        let ax = 0;
        let ay = 0;
        const speed = Math.hypot(c.vx, c.vy);
        let maxSpeed = c.kind === "ray" ? 8 : c.kind === "jelly" ? 4 : 9;

        if (c.hero && focus) {
          // Feed-forward orbit: match the target's velocity, then correct toward its position.
          const tx = focus.x + Math.cos(orbitAngle) * focus.rx;
          const ty = focus.y + Math.sin(orbitAngle) * focus.ry;
          const tvx = -Math.sin(orbitAngle) * focus.rx * omega;
          const tvy = Math.cos(orbitAngle) * focus.ry * omega;
          ax += (tvx + (tx - c.x) * 1.8 - c.vx) * 3.2;
          ay += (tvy + (ty - c.y) * 1.8 - c.vy) * 3.2;
          maxSpeed = Math.hypot(tvx, tvy) + 14;
        } else if (c.kind === "jelly") {
          const k = c.phase < 0.25 ? 1 - c.phase / 0.25 : 0;
          const tilt = c.heading;
          ax += Math.sin(tilt) * k * 7 + noise1(c.seed + t * 0.1) * 0.9 - c.vx * 0.6;
          ay += -Math.cos(tilt) * k * 7 + 0.35 - c.vy * 1.1;
        } else {
          const cruise = c.kind === "ray" ? 3.2 : 4.6;
          const wander = noise1(c.seed + t * 0.07) * Math.PI * 1.6 + c.seed;
          let dvx = Math.cos(wander) * cruise;
          let dvy = Math.sin(wander) * cruise * (c.kind === "school" ? 0.35 : 0.55);
          if (c.hero && following) {
            const dx = pointer.x - c.x;
            const dy = pointer.y - c.y;
            const d = Math.hypot(dx, dy) || 1;
            const standoff = c.size * 0.45;
            const pull = clamp((d - standoff) * 0.8, -2, cruise * 2.4);
            dvx = dvx * 0.25 + (dx / d) * pull;
            dvy = dvy * 0.25 + (dy / d) * pull;
          }
          ax += (dvx - c.vx) * 1.1;
          ay += (dvy - c.vy) * 1.1;
        }

        if (!(c.hero && focus)) {
          // Soft walls that let creatures slip partly out of view before turning back.
          const pad = -c.radius * 0.3;
          if (c.x < pad) ax += (pad - c.x) * 0.5;
          if (c.x > cols - pad) ax -= (c.x - (cols - pad)) * 0.5;
          if (c.kind !== "jelly") {
            if (c.y < pad) ay += (pad - c.y) * 0.5;
            if (c.y > rows - pad) ay -= (c.y - (rows - pad)) * 0.5;
          }
          for (const o of list) {
            if (o === c) continue;
            const dx = c.x - o.x;
            const dy = c.y - o.y;
            const d = Math.hypot(dx, dy) || 1;
            const min = (c.radius + o.radius) * 0.75;
            if (d < min) {
              const push = ((min - d) / min) * (o.hero ? 9 : 5);
              ax += (dx / d) * push;
              ay += (dy / d) * push;
            }
          }
        }

        c.vx += ax * sdt;
        c.vy += ay * sdt;
        const s = Math.hypot(c.vx, c.vy);
        if (s > maxSpeed) {
          c.vx *= maxSpeed / s;
          c.vy *= maxSpeed / s;
        }
        c.x += c.vx * sdt;
        c.y += c.vy * sdt;

        if (c.kind === "jelly") {
          // Jellyfish pulse upward and re-enter from below.
          c.heading += (clamp(c.vx * 0.25, -0.45, 0.45) - c.heading) * Math.min(1, sdt * 2);
          c.phase = (c.phase + sdt / (thinking ? 1.7 : 2.8)) % 1;
          if (!c.hero && c.y < -c.size * 4) {
            c.y = rows + c.size * 1.5;
            c.x = rand(0.1, 0.9) * cols;
          } else if (!c.hero && c.y > rows + c.size * 5) {
            c.y = -c.size * 3;
          }
        } else {
          if (speed > 0.2) c.heading += angleDiff(c.heading, Math.atan2(c.vy, c.vx)) * Math.min(1, sdt * 3);
          const flapHz = c.kind === "ray" ? 0.42 * (1 + speed / 14) * (c.hero && thinking ? 1.6 : 1) * (c.hero ? 1 + energy * 0.6 : 1) : 0;
          c.phase += sdt * TAU * flapHz;
        }

        if (c.kind === "school") {
          const ch = Math.cos(c.heading);
          const sh = Math.sin(c.heading);
          for (const f of c.members) {
            const ox = f.ox * c.size;
            const oy = f.oy * c.size * 0.6;
            const tx = c.x + ox * ch - oy * sh + noise1(f.seed + t * 0.4) * 0.9;
            const ty = c.y + ox * sh + oy * ch + noise1(f.seed * 1.7 + t * 0.4) * 0.7;
            f.vx += ((tx - f.x) * 4.5 - (f.vx - c.vx) * 2.4) * sdt;
            f.vy += ((ty - f.y) * 4.5 - (f.vy - c.vy) * 2.4) * sdt;
            if (following) {
              // Small fish dart away from a nearby cursor, then fall back into formation.
              const dx = f.x - pointer.x;
              const dy = f.y - pointer.y;
              const d = Math.hypot(dx, dy) || 1;
              if (d < 7) {
                f.vx += (dx / d) * (7 - d) * 9 * sdt;
                f.vy += (dy / d) * (7 - d) * 9 * sdt;
              }
            }
            f.x += f.vx * sdt;
            f.y += f.vy * sdt;
            const fs = Math.hypot(f.vx, f.vy);
            if (fs > 0.3) f.heading += angleDiff(f.heading, Math.atan2(f.vy, f.vx)) * Math.min(1, sdt * 6);
            f.phase += sdt * (7 + fs);
          }
        }
      }

      // Wakes: rays and fish stir the water behind them, jellyfish push a puff on each pulse.
      const deposit = (x: number, y: number, amount: number) => {
        const col = Math.floor(x);
        const row = Math.floor(y);
        if (col >= 0 && row >= 0 && col < cols && row < rows) wake.add(row * cols + col, amount * slow);
      };
      for (const c of list) {
        const speed = Math.hypot(c.vx, c.vy);
        if (c.kind === "ray") {
          const back = c.size * (0.62 + 0.38 * c.z) * 0.24;
          const span = c.size * (0.62 + 0.38 * c.z) * 0.4;
          const ch = Math.cos(c.heading);
          const sh = Math.sin(c.heading);
          for (const side of [-1, 1]) deposit(c.x - ch * back - sh * span * side, c.y - sh * back + ch * span * side, (0.04 + speed * 0.012) * (c.hero ? 1.5 : 1));
          deposit(c.x - ch * back * 2.2, c.y - sh * back * 2.2, 0.03 + speed * 0.01);
        } else if (c.kind === "jelly") {
          if (c.phase < 0.25) deposit(c.x - Math.sin(c.heading) * c.size * 0.2, c.y + Math.cos(c.heading) * c.size * 0.4, 0.12);
        } else {
          for (const f of c.members) deposit(f.x - Math.cos(f.heading) * 1.5, f.y - Math.sin(f.heading) * 1.5, 0.02 + Math.hypot(f.vx, f.vy) * 0.006);
        }
      }
      if (pointer.active && interactive && clock - pointer.at < 0.2) deposit(pointer.x, pointer.y, 0.05);
      wake.step(sdt, 1.3);

      for (const cluster of clusters) {
        cluster.age += sdt;
        if (cluster.age > cluster.life) Object.assign(cluster, newCluster(false));
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].age += dt;
        if (ripples[i].age > 1.7) ripples.splice(i, 1);
      }
      particles = particles.filter((p) => {
        p.age += dt;
        const drag = Math.exp(-3 * dt);
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        return p.age < p.life;
      });
    };

    // --- drawing ------------------------------------------------------------------------------
    const shade = (l: number, z: number, accent: number, alpha = 1) => {
      const v = Math.round(Math.min(255, l + (1 - z) * 70));
      return alpha === 1 ? `rgb(${v}, ${v}, ${accent})` : `rgba(${v}, ${v}, ${accent}, ${alpha})`;
    };

    const drawRay = (c: Creature, b: number) => {
      const S = c.size * (0.62 + 0.38 * c.z);
      const L = S * 0.5;
      const flap = Math.sin(c.phase);
      const span = S * 0.5 * (0.84 + 0.16 * Math.cos(c.phase));
      // Wing tips sweep back and forth with the flap.
      const tipX = -L * 0.3 - flap * L * 0.12;
      lctx.save();
      lctx.translate(c.x, c.y);
      lctx.rotate(c.heading);
      lctx.lineCap = "round";
      // Tail
      lctx.beginPath();
      lctx.moveTo(-L * 0.42, 0);
      lctx.quadraticCurveTo(-L, Math.sin(c.phase * 0.5 + 1) * S * 0.06, -L * 1.55, Math.sin(c.phase * 0.5) * S * 0.1);
      lctx.strokeStyle = shade(150, c.z, b);
      lctx.lineWidth = Math.max(0.65, S * 0.035);
      lctx.stroke();
      // Head fins
      lctx.beginPath();
      lctx.moveTo(L * 0.36, span * 0.15);
      lctx.lineTo(L * 0.66, span * 0.12);
      lctx.moveTo(L * 0.36, -span * 0.15);
      lctx.lineTo(L * 0.66, -span * 0.12);
      lctx.strokeStyle = shade(120, c.z, b);
      lctx.lineWidth = Math.max(0.8, S * 0.05);
      lctx.stroke();
      // Body and wings
      const body = lctx.createRadialGradient(L * 0.05, 0, 0, L * 0.05, 0, S * 0.5);
      body.addColorStop(0, shade(18, c.z, b));
      body.addColorStop(0.42, shade(96, c.z, b));
      body.addColorStop(1, shade(214, c.z, b));
      lctx.beginPath();
      // Swept leading edges to pointed tips, concave trailing edges back to the tail.
      lctx.moveTo(L * 0.42, 0);
      lctx.quadraticCurveTo(L * 0.22, span * 0.7, tipX, span);
      lctx.quadraticCurveTo(-L * 0.02, span * 0.34, -L * 0.42, 0);
      lctx.quadraticCurveTo(-L * 0.02, -span * 0.34, tipX, -span);
      lctx.quadraticCurveTo(L * 0.22, -span * 0.7, L * 0.42, 0);
      lctx.fillStyle = body;
      lctx.fill();
      lctx.restore();
    };

    const drawJelly = (c: Creature, b: number) => {
      const R = c.size * (0.62 + 0.38 * c.z);
      const k = c.phase < 0.25 ? smoothstep(0, 0.25, c.phase) : 1 - smoothstep(0.25, 1, c.phase);
      const sx = 1 - 0.18 * k;
      const sy = 1 + 0.12 * k;
      lctx.save();
      lctx.translate(c.x, c.y);
      lctx.rotate(c.heading);
      lctx.lineCap = "round";
      // Thin tentacles trail behind the bell and sway; they mostly land on line glyphs.
      lctx.strokeStyle = shade(170, c.z, b, 0.62);
      lctx.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) {
        const x0 = (i / 3 - 0.5) * 1.6 * R * sx;
        const len = R * (2.6 + 0.7 * Math.sin(t * 0.7 + i * 1.3 + c.seed));
        lctx.beginPath();
        lctx.moveTo(x0, 0);
        for (let s = 1; s <= 8; s++) {
          const f = s / 8;
          lctx.lineTo(x0 + Math.sin(t * 1.4 + s * 0.65 + i * 1.7 + c.seed) * R * 0.38 * f, len * f);
        }
        lctx.stroke();
      }
      // Oral arms
      lctx.strokeStyle = shade(110, c.z, b);
      lctx.lineWidth = Math.max(0.7, R * 0.16);
      for (let i = 0; i < 2; i++) {
        const x0 = (i - 0.5) * R * 0.4;
        lctx.beginPath();
        lctx.moveTo(x0, R * 0.1);
        lctx.quadraticCurveTo(x0 + Math.sin(t * 1.2 + i * 2 + c.seed) * R * 0.3, R * 0.8, x0 + Math.sin(t + i * 2) * R * 0.25, R * 1.35);
        lctx.stroke();
      }
      // Bell
      const bell = lctx.createLinearGradient(0, -R * sy, 0, 0);
      bell.addColorStop(0, shade(175, c.z, b));
      bell.addColorStop(0.7, shade(120, c.z, b));
      bell.addColorStop(1, shade(55, c.z, b));
      lctx.beginPath();
      lctx.ellipse(0, 0, R * sx, R * 1.05 * sy, 0, Math.PI, TAU);
      lctx.quadraticCurveTo(0, -R * 0.3, -R * sx, 0);
      lctx.fillStyle = bell;
      lctx.fill();
      lctx.restore();
    };

    const drawSchool = (c: Creature, b: number) => {
      const s = 0.62 + 0.38 * c.z;
      const body = shade(55, c.z, b);
      const tail = shade(140, c.z, b);
      for (const f of c.members) {
        lctx.save();
        lctx.translate(f.x, f.y);
        lctx.rotate(f.heading);
        lctx.beginPath();
        lctx.ellipse(0, 0, 1.6 * s, 0.62 * s, 0, 0, TAU);
        lctx.fillStyle = body;
        lctx.fill();
        lctx.rotate(Math.sin(f.phase) * 0.35);
        lctx.beginPath();
        lctx.moveTo(-1.3 * s, 0);
        lctx.lineTo(-2.4 * s, 0.75 * s);
        lctx.lineTo(-2.4 * s, -0.75 * s);
        lctx.closePath();
        lctx.fillStyle = tail;
        lctx.fill();
        lctx.restore();
      }
    };

    const blit = (glyph: number, tint: number, x: number, y: number) => {
      if (atlas) ctx.drawImage(atlas, glyph * glyphPx, tint * glyphPx, glyphPx, glyphPx, x, y, glyphPx, glyphPx);
    };

    const render = () => {
      if (!cols || !rows) return;
      if (latest.current.paletteKey !== paletteKey) applyPalette();
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.clearRect(0, 0, cols, rows);
      for (const c of drawOrder) {
        lctx.globalAlpha = 0.5 + 0.5 * c.z;
        const b = c.hero ? 255 : 0;
        if (c.kind === "ray") drawRay(c, b);
        else if (c.kind === "jelly") drawJelly(c, b);
        else drawSchool(c, b);
      }
      lctx.globalAlpha = 1;
      const img = lctx.getImageData(0, 0, cols, rows).data;
      const still = reduce.matches;
      /** Brightness of a cell's paint, or 1 (thin) where nothing is painted. */
      const lum = (k: number) => (img[k * 4 + 3] < ALPHA_SKIP * 255 ? 1 : img[k * 4] / 255);

      // Ripples and bursts win over creature glyphs in the cells they pass through.
      overlay.fill(-1);
      for (const r of ripples) {
        for (let ring = 0; ring < 2; ring++) {
          const age = r.age - ring * 0.16;
          if (age < 0 || age > 1.5) continue;
          const p = age / 1.5;
          const radius = (1 - (1 - p) ** 3) * r.max;
          const alpha = (1 - p) ** 1.4 * (ring ? 0.55 : 0.9);
          const n = Math.max(6, Math.ceil(TAU * radius * 1.15));
          let prev = -1;
          for (let j = 0; j < n; j++) {
            const theta = (j / n) * TAU;
            const col = Math.floor(r.x + Math.cos(theta) * radius);
            const row = Math.floor(r.y + Math.sin(theta) * radius);
            if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
            const i = row * cols + col;
            if (i === prev) continue;
            prev = i;
            if (overlay[i] < 0 || alpha > overlayAlpha[i]) {
              // The ring's tangent picks - \ | / so it reads as a drawn circle.
              overlay[i] = lineGlyph(theta);
              overlayAlpha[i] = alpha;
              overlayTint[i] = ring ? 1 : 0;
            }
          }
        }
      }
      for (const p of particles) {
        const col = Math.floor(p.x);
        const row = Math.floor(p.y);
        if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
        const i = row * cols + col;
        const f = p.age / p.life;
        overlay[i] = SPARK_I[f < 0.35 ? 0 : f < 0.7 ? 1 : 2];
        overlayAlpha[i] = (1 - f) * 0.95;
        overlayTint[i] = TINTS - 1;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.width, el.height);
      const pitch = cellPx * dpr;
      const inset = Math.max(1, Math.round(dpr));
      let fill = -1;
      for (let row = 0; row < rows; row++) {
        const y = Math.round(row * pitch);
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          const x = Math.round(col * pitch);
          if (overlay[i] >= 0) {
            ctx.globalAlpha = overlayAlpha[i];
            blit(overlay[i], overlayTint[i], x, y);
            continue;
          }
          const a = img[i * 4 + 3] / 255;
          if (a < ALPHA_SKIP) continue;
          const tint = Math.round((img[i * 4 + 2] / 255) * (TINTS - 1));
          if (a < ALPHA_EDGE) {
            // Faint edges become outline strokes, oriented by which way the coverage falls off.
            const gx = (col + 1 < cols ? img[(i + 1) * 4 + 3] : 0) - (col > 0 ? img[(i - 1) * 4 + 3] : 0);
            const gy = (row + 1 < rows ? img[(i + cols) * 4 + 3] : 0) - (row > 0 ? img[(i - cols) * 4 + 3] : 0);
            ctx.globalAlpha = 0.2 + a;
            blit(Math.abs(gx) + Math.abs(gy) < 24 ? SPARK_I[2] : lineGlyph(Math.atan2(gy, gx)), tint, x, y);
            continue;
          }
          // Light from the top left: thickness rises toward the middle of a body, so the side whose
          // thickness grows toward the bottom right faces the light and the far side falls into shade.
          const gx = (col > 0 ? lum(i - 1) : 1) - (col + 1 < cols ? lum(i + 1) : 1);
          const gy = (row > 0 ? lum(i - cols) : 1) - (row + 1 < rows ? lum(i + cols) : 1);
          const facing = clamp((gx * 0.6 + gy * 0.8) * 1.6, -1, 1);
          const l = clamp(img[i * 4] / 255 + facing * 0.2, 0, 1);
          // A rare glint in the accent color, re-rolled on a slow staggered clock, like light on skin.
          const glint = !still && hash3(col, row, Math.floor(clock * 2.2 + hash3(col, row, 3) * 4)) < 0.035 && l < 0.7;
          const t2 = glint ? TINTS - 1 : tint;
          if (t2 !== fill) {
            ctx.fillStyle = tints[t2] ?? "#000";
            fill = t2;
          }
          // Solid shaded cells: denser in shadow, barely there where the light hits.
          ctx.globalAlpha = (0.05 + 0.2 * (1 - l) ** 1.3) * a;
          ctx.fillRect(x + inset, y + inset, glyphPx - inset, glyphPx - inset);
          ctx.globalAlpha = 0.5 + 0.5 * a;
          blit(l < 0.36 ? pickGlyph(DARK_I, l / 0.36) : l < 0.68 ? pickGlyph(MID_I, (l - 0.36) / 0.32) : pickGlyph(LIGHT_I, (l - 0.68) / 0.32), t2, x, y);
        }
      }

      // The wake lights small dots in empty water, brighter where it is strong.
      const dot = Math.max(2, Math.round(pitch * 0.3));
      const e = wake.energy;
      for (let level = 0; level < 4; level++) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgba(${accentRgb}, ${0.3 + level * 0.18})`;
        for (let i = 0; i < e.length; i++) {
          if (e[i] < 0.12 || overlay[i] >= 0 || img[i * 4 + 3] >= ALPHA_SKIP * 255) continue;
          if (Math.min(3, Math.floor((e[i] - 0.12) * 6)) !== level) continue;
          ctx.fillRect(Math.round((i % cols) * pitch + (pitch - dot) / 2), Math.round(((i / cols) | 0) * pitch + (pitch - dot) / 2), dot, dot);
        }
      }

      // Twinkling specks fill empty water.
      const twinkle = (currentMode === "thinking" ? 2 : 1) * (reduce.matches ? 0.3 : 1);
      for (const cluster of clusters) {
        const env = smoothstep(0, 0.15, cluster.age / cluster.life) * (1 - smoothstep(0.85, 1, cluster.age / cluster.life));
        for (const s of cluster.specks) {
          const col = Math.floor(cluster.x + s.dx);
          const row = Math.floor(cluster.y + s.dy);
          if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
          const i = row * cols + col;
          if (overlay[i] >= 0 || img[i * 4 + 3] >= ALPHA_SKIP * 255) continue;
          const tw = Math.sin(clock * s.freq * TAU * twinkle * 0.5 + s.phase);
          if (tw < 0.25) continue;
          const level = (tw - 0.25) / 0.75;
          ctx.globalAlpha = (0.16 + 0.4 * level) * env;
          blit(SPARK_I[level < 0.35 ? 2 : level < 0.75 ? 1 : 0], s.accent ? TINTS - 1 : 0, Math.round(col * pitch), Math.round(row * pitch));
        }
      }
      ctx.globalAlpha = 1;
    };

    // --- loop ---------------------------------------------------------------------------------
    const shouldRun = () => visible && !latest.current.paused && document.visibilityState === "visible";
    const frame = (now: number) => {
      raf = 0;
      if (last && now - last < 12) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (latest.current.creaturesKey !== creaturesKey) spawn();
      const target = latest.current.focusRef?.current ?? null;
      if (target !== typingTarget) {
        typingTarget?.removeEventListener("input", onTyping);
        target?.addEventListener("input", onTyping);
        typingTarget = target;
      }
      step(dt);
      render();
      if (shouldRun()) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const run = () => {
      if (!raf && shouldRun()) raf = requestAnimationFrame(frame);
    };

    const addRipple = (clientX: number, clientY: number) => {
      if (reduce.matches || !cols) return;
      const box = host.getBoundingClientRect();
      const x = (clientX - box.left) / cellPx;
      const y = (clientY - box.top) / cellPx;
      ripples.push({ x, y, age: 0, max: clamp(Math.min(cols, rows) * 0.22 + 8, 10, 26) });
      for (let j = 0; j < 24; j++) {
        const col = Math.floor(x + Math.cos((j / 24) * TAU) * 2.5);
        const row = Math.floor(y + Math.sin((j / 24) * TAU) * 2.5);
        if (col >= 0 && row >= 0 && col < cols && row < rows) wake.add(row * cols + col, 1);
      }
      if (ripples.length > 6) ripples.shift();
      if (latest.current.burst) {
        for (let i = 0; i < 14; i++) {
          const angle = rand(0, TAU);
          const speed = rand(10, 24);
          particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, age: 0, life: rand(0.55, 1) });
        }
      }
      // Nearby creatures startle away from the splash.
      for (const c of list) {
        const push = (px: number, py: number, apply: (dx: number, dy: number) => void) => {
          const dx = px - x;
          const dy = py - y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 18) apply((dx / d) * 9 * (1 - d / 18), (dy / d) * 9 * (1 - d / 18));
        };
        push(c.x, c.y, (dx, dy) => {
          c.vx += dx;
          c.vy += dy;
        });
        for (const f of c.members) {
          push(f.x, f.y, (dx, dy) => {
            f.vx += dx * 1.6;
            f.vy += dy * 1.6;
          });
        }
      }
      run();
    };

    api.current = { run, ripple: addRipple };

    measure();
    applyPalette();
    step(0);
    render();
    run();

    const resizeObserver = new ResizeObserver(() => {
      measure();
      if (!raf) render();
    });
    resizeObserver.observe(host);
    const onWindowResize = () => {
      measure();
      if (!raf) render();
    };
    window.addEventListener("resize", onWindowResize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      run();
    });
    intersection.observe(host);
    const onVisibility = () => run();
    document.addEventListener("visibilitychange", onVisibility);

    const toCells = (event: PointerEvent) => {
      const box = host.getBoundingClientRect();
      pointer.x = (event.clientX - box.left) / cellPx;
      pointer.y = (event.clientY - box.top) / cellPx;
      pointer.active = true;
      pointer.at = clock;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (latest.current.interactive) toCells(event);
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    const onClick = (event: MouseEvent) => {
      if (!latest.current.interactive || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(IGNORE) || latest.current.focusRef?.current?.contains(target)) return;
      if (window.getSelection()?.isCollapsed === false) return;
      addRipple(event.clientX, event.clientY);
    };
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    host.addEventListener("click", onClick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      api.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      host.removeEventListener("click", onClick);
      typingTarget?.removeEventListener("input", onTyping);
    };
  }, []);

  return (
    <div
      ref={root}
      className={cn(
        "relative isolate overflow-hidden [--cell:9px] sm:[--cell:11px] lg:[--cell:12px]",
        "bg-(--aquarium-bg) [background-image:linear-gradient(to_right,var(--aquarium-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--aquarium-grid)_1px,transparent_1px)] [background-size:var(--cell)_var(--cell)]",
        className,
      )}
      style={
        {
          "--aquarium-bg": colors.background,
          "--aquarium-grid": colors.grid,
          ...(cell ? { "--cell": `${cell}px` } : null),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full font-mono" />
      {children}
    </div>
  );
}
