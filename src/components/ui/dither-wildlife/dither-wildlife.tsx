"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DitherWildlifeScene = "horses" | "birds" | "grove";

export interface DitherWildlifeProps extends Omit<ComponentProps<"div">, "children"> {
  /** Content above the scene, e.g. a hero. */
  children?: ReactNode;
  /** What runs, flies or sways across the canvas. @default "horses" */
  scene?: DitherWildlifeScene;
  /** Size of one pixel in px. @default 5 */
  cell?: number;
  /** Ink tones from light to dark; shading is dithered between them. @default four grays */
  tones?: string[];
  /** Paper color behind the scene (any CSS color, or "transparent"). @default "#ffffff" */
  background?: string;
  /** How many horses, birds or trees. @default 3, 26 or 8 by scene */
  count?: number;
  /** Speed multiplier. @default 1 */
  speed?: number;
  /** Birds scatter from the pointer and trees bend away from it. @default true */
  interactive?: boolean;
  /** Freezes the scene. @default false */
  paused?: boolean;
}

const DEFAULT_TONES = ["#c6c6c6", "#9c9c9c", "#6f6f6f", "#474747"];
const TAU = Math.PI * 2;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

const hash = (n: number) => {
  let h = Math.imul(n | 0, 2654435761) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
};

/** Darkness 0 (paper) to 1 (darkest ink), lightened with distance. */
const ink = (d: number, fade = 0) => {
  const g = Math.round(255 * (1 - Math.max(0, Math.min(1, d * (1 - fade)))));
  return `rgb(${g},${g},${g})`;
};

const parse = (color: string) => {
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return [0, 0, 0];
  c.fillStyle = color;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
};

/* ------------------------------------------------------------------ horses */

interface Horse {
  x: number;
  z: number;
  phase: number;
  speed: number;
  seed: number;
}

/** A galloping horse facing left, drawn in body units (about 4 wide, 3 tall) around its barrel. */
function drawHorse(ctx: CanvasRenderingContext2D, phase: number, fade: number) {
  const bob = -0.1 * Math.sin(phase * 2);
  const pitch = 0.05 * Math.sin(phase * 2 + 1);
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(pitch);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Legs: rotary gallop, far legs paler and drawn first.
  const legs = [
    { hip: [0.72, 0.18], front: false, p: 0, far: true },
    { hip: [-0.62, 0.22], front: true, p: 1.7, far: true },
    { hip: [0.7, 0.2], front: false, p: 0.7, far: false },
    { hip: [-0.66, 0.24], front: true, p: 2.4, far: false },
  ];
  const leg = (l: (typeof legs)[number]) => {
    const s = Math.sin(phase + l.p);
    const swing = Math.max(0, Math.sin(phase + l.p + 1.5)) ** 1.4;
    const a = l.front ? 0.2 + 0.75 * s : -0.15 + 0.7 * s;
    const b = l.front ? a - 1.5 * swing : a - 0.45 - 0.9 * swing;
    const [hx, hy] = l.hip;
    const kx = hx - 0.6 * Math.sin(a);
    const ky = hy + 0.6 * Math.cos(a);
    const fx = kx - 0.62 * Math.sin(b);
    const fy = ky + 0.62 * Math.cos(b);
    const d = l.far ? 0.42 : 0.62;
    ctx.strokeStyle = ink(d, fade);
    ctx.lineWidth = 0.24;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(kx, ky);
    ctx.stroke();
    ctx.lineWidth = 0.13;
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.fillStyle = ink(d + 0.25, fade);
    ctx.beginPath();
    ctx.arc(fx, fy, 0.075, 0, TAU);
    ctx.fill();
  };
  legs.filter((l) => l.far).forEach(leg);

  // Tail, streaming back.
  const wave = Math.sin(phase * 2 + 0.6);
  ctx.strokeStyle = ink(0.72, fade);
  ctx.lineWidth = 0.22;
  ctx.beginPath();
  ctx.moveTo(1.0, -0.28);
  ctx.quadraticCurveTo(1.45, -0.35 + wave * 0.1, 1.8, 0.05 + wave * 0.18);
  ctx.stroke();
  ctx.lineWidth = 0.12;
  ctx.beginPath();
  ctx.moveTo(1.05, -0.2);
  ctx.quadraticCurveTo(1.5, -0.12 + wave * 0.12, 1.72, 0.28 + wave * 0.15);
  ctx.stroke();

  // Body: barrel, chest and quarters, lit from above.
  const body = ctx.createLinearGradient(0, -0.5, 0, 0.5);
  body.addColorStop(0, ink(0.3, fade));
  body.addColorStop(0.5, ink(0.5, fade));
  body.addColorStop(1, ink(0.82, fade));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 0.95, 0.42, 0, 0, TAU);
  ctx.moveTo(-0.32, 0.02);
  ctx.arc(-0.72, 0.02, 0.4, 0, TAU);
  ctx.moveTo(1.15, -0.05);
  ctx.arc(0.7, -0.05, 0.45, 0, TAU);
  ctx.fill();

  // Neck and head.
  const neck = ctx.createLinearGradient(-1.4, -1, -0.6, 0.2);
  neck.addColorStop(0, ink(0.36, fade));
  neck.addColorStop(1, ink(0.68, fade));
  ctx.fillStyle = neck;
  ctx.beginPath();
  ctx.moveTo(-0.45, -0.4);
  ctx.quadraticCurveTo(-0.95, -0.75, -1.18, -1.02);
  ctx.lineTo(-1.36, -1.08);
  ctx.quadraticCurveTo(-1.62, -0.9, -1.9, -0.56);
  ctx.quadraticCurveTo(-1.98, -0.4, -1.86, -0.33);
  ctx.quadraticCurveTo(-1.66, -0.38, -1.48, -0.55);
  ctx.quadraticCurveTo(-1.3, -0.25, -1.05, 0.2);
  ctx.lineTo(-0.6, 0.2);
  ctx.closePath();
  ctx.fill();
  // Muzzle, eye and ear in deeper ink.
  ctx.fillStyle = ink(0.8, fade);
  ctx.beginPath();
  ctx.ellipse(-1.84, -0.43, 0.08, 0.07, 0.5, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-1.4, -0.88, 0.06, 0, TAU);
  ctx.fill();
  ctx.fillStyle = ink(0.6, fade);
  ctx.beginPath();
  ctx.moveTo(-1.2, -1.02);
  ctx.lineTo(-1.14, -1.28);
  ctx.lineTo(-1.32, -1.08);
  ctx.closePath();
  ctx.fill();
  // Mane, flicking with the stride.
  ctx.strokeStyle = ink(0.74, fade);
  ctx.lineWidth = 0.16;
  ctx.beginPath();
  ctx.moveTo(-1.22, -1.0);
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    const mx = -1.22 + t * 0.85;
    const my = -1.0 + t * 0.62 + Math.sin(phase * 2 + i) * 0.05;
    ctx.lineTo(mx + 0.06, my - 0.1);
    ctx.lineTo(mx, my);
  }
  ctx.stroke();
  // A soft highlight across the back and neck, like sun on the coat.
  const sheen = ctx.createRadialGradient(-0.4, -0.42, 0, -0.4, -0.42, 0.9);
  sheen.addColorStop(0, "rgba(255,255,255,0.9)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.ellipse(-0.3, -0.25, 1.0, 0.45, -0.2, 0, TAU);
  ctx.fill();

  legs.filter((l) => !l.far).forEach(leg);
  ctx.restore();
}

/* ------------------------------------------------------------------- birds */

interface Bird {
  /** Place in the flock, relative to its wandering center. */
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  flap: number;
  rate: number;
  glide: number;
}

/** A gull seen from the side and below: an "M" of wings around a small body, about 2 units wide. */
function drawBird(ctx: CanvasRenderingContext2D, flap: number, fade: number) {
  const up = Math.cos(flap);
  ctx.fillStyle = ink(0.78, fade);
  for (const side of [-1, 1]) {
    const ex = side * 0.42;
    const ey = -0.18 - 0.32 * up;
    const tx = side * 1.0;
    const ty = 0.02 - 0.62 * up;
    ctx.beginPath();
    ctx.moveTo(0, -0.04);
    ctx.quadraticCurveTo(side * 0.2, ey - 0.06, ex, ey);
    ctx.quadraticCurveTo(side * 0.72, ey - 0.02, tx, ty);
    ctx.quadraticCurveTo(side * 0.7, ey + 0.16, ex, ey + 0.14);
    ctx.quadraticCurveTo(side * 0.2, ey + 0.12, 0, 0.12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0.06, 0.14, 0.1, 0, 0, TAU);
  ctx.fill();
}

/* ------------------------------------------------------------------- trees */

interface Tree {
  kind: "round" | "pine";
  x: number;
  z: number;
  h: number;
  lean: number;
  seed: number;
  blobs: { x: number; y: number; r: number }[];
}

function makeTree(x: number, z: number, seed: number): Tree {
  const blobs: Tree["blobs"] = [];
  const n = 7 + Math.floor(hash(seed) * 5);
  for (let i = 0; i < n; i++) {
    const a = hash(seed * 7 + i) * TAU;
    const d = Math.sqrt(hash(seed * 13 + i)) * 0.42;
    blobs.push({ x: Math.cos(a) * d * 1.3, y: -0.78 + Math.sin(a) * d * 0.8, r: 0.2 + hash(seed * 3 + i) * 0.17 });
  }
  return { kind: hash(seed * 17) > 0.6 ? "pine" : "round", x, z, h: 0.7 + hash(seed * 5) * 0.5, lean: (hash(seed * 11) - 0.5) * 0.12, seed, blobs };
}

/** A tree 1 unit tall standing at the origin; `sway` bends the crown sideways. */
function drawTree(ctx: CanvasRenderingContext2D, tree: Tree, sway: number, fade: number) {
  ctx.lineCap = "round";
  if (tree.kind === "pine") {
    // Stacked tiers, each bending a little more toward the top.
    ctx.strokeStyle = ink(0.78, fade);
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(sway * 0.4, -0.3);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const y = -0.22 - i * 0.26;
      const w = 0.42 - i * 0.08;
      const bend = sway * (0.5 + i * 0.35);
      const g = ctx.createLinearGradient(-w + bend, 0, w + bend, 0);
      g.addColorStop(0, ink(0.3, fade));
      g.addColorStop(1, ink(0.72, fade));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-w + bend * 0.8, y);
      ctx.lineTo(bend * 1.2, y - 0.42);
      ctx.lineTo(w + bend * 0.8, y);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }
  const top = { x: tree.lean + sway * 0.6, y: -0.62 };
  ctx.strokeStyle = ink(0.78, fade);
  ctx.lineWidth = 0.075;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(tree.lean * 0.5, -0.3, top.x, top.y);
  ctx.stroke();
  ctx.lineWidth = 0.035;
  for (const b of tree.blobs.slice(0, 4)) {
    ctx.beginPath();
    ctx.moveTo(top.x * 0.6, -0.42);
    ctx.lineTo(b.x * 0.7 + sway, b.y * 0.9);
    ctx.stroke();
  }
  for (const b of tree.blobs) {
    const bend = sway * (0.6 + -b.y * 0.6);
    const cx = b.x + bend;
    const g = ctx.createRadialGradient(cx - b.r * 0.4, b.y - b.r * 0.45, b.r * 0.1, cx, b.y, b.r);
    g.addColorStop(0, ink(0.2, fade));
    g.addColorStop(0.7, ink(0.48, fade));
    g.addColorStop(1, ink(0.66, fade));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, b.y, b.r, 0, TAU);
    ctx.fill();
  }
}

/* --------------------------------------------------------------- component */

/**
 * A dithered pixel-art scene in a handful of gray inks, like an old handheld screen: horses
 * galloping past, a flock of birds wheeling (and scattering from the pointer), or a grove of trees
 * swaying in the wind. Shapes are shaded softly, then ordered-dithered into the tones.
 */
export function DitherWildlife({
  children,
  scene = "horses",
  cell = 5,
  tones = DEFAULT_TONES,
  background = "#ffffff",
  count,
  speed = 1,
  interactive = true,
  paused = false,
  className,
  style,
  ...props
}: DitherWildlifeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ speed, interactive, paused });
  useEffect(() => {
    live.current = { speed, interactive, paused };
  });
  const toneKey = tones.join(",");

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const low = document.createElement("canvas");
    const lctx = low.getContext("2d", { willReadFrequently: true });
    const out = document.createElement("canvas");
    const octx = out.getContext("2d");
    if (!root || !canvas || !ctx || !lctx || !octx) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const inks = toneKey.split(",").map(parse);

    let cols = 0;
    let rows = 0;
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let time = 0;
    const pointer = { x: -1e4, y: -1e4, on: false };

    const n = count ?? (scene === "horses" ? 3 : scene === "birds" ? 26 : 8);
    let horses: Horse[] = [];
    let birds: Bird[] = [];
    let trees: Tree[] = [];
    let leaves: { x: number; y: number; vy: number; s: number }[] = [];

    /** Horses run on an endless loop this long, so they stay evenly spaced. */
    const loop = () => cols + rows * 0.24 * 5;

    const seedScene = () => {
      if (scene === "horses") {
        horses = Array.from({ length: n }, (_, i) => ({
          x: cols * 0.3 + (i * loop()) / n,
          z: 1 - ((i * 0.618) % 1) * 0.6,
          phase: hash(i + 3) * TAU,
          speed: 0.9 + hash(i + 9) * 0.25,
          seed: i,
        }));
        birds = Array.from({ length: 5 }, (_, i) => ({ ox: 0, oy: 0, x: cols * hash(i + 40), y: rows * (0.1 + hash(i + 50) * 0.18), vx: -0.9 - hash(i) * 0.3, vy: 0, z: 0.25, flap: hash(i + 7) * TAU, rate: 9, glide: 0 }));
      } else if (scene === "birds") {
        birds = Array.from({ length: n }, (_, i) => {
          const z = 0.25 + hash(i + 11) * 0.75;
          return { ox: (hash(i + 31) - 0.5) * 0.7, oy: (hash(i + 32) - 0.5) * 0.45, x: cols * hash(i + 1), y: rows * (0.15 + hash(i + 2) * 0.6), vx: 1.6 + hash(i + 3), vy: (hash(i + 4) - 0.5) * 0.6, z, flap: hash(i + 5) * TAU, rate: 7 + hash(i + 6) * 4, glide: 0 };
        });
      } else {
        trees = Array.from({ length: n }, (_, i) => makeTree(cols * ((i + 0.3 + (hash(i + 21) - 0.5) * 0.6) / n), 0.3 + (((i * 0.382) % 1) * 0.7), i + 1));
        trees.sort((a, b) => a.z - b.z);
        birds = Array.from({ length: 4 }, (_, i) => ({ ox: 0, oy: 0, x: cols * hash(i + 60), y: rows * (0.08 + hash(i + 70) * 0.15), vx: 1.1 + hash(i) * 0.4, vy: 0, z: 0.25, flap: hash(i + 8) * TAU, rate: 9, glide: 0 }));
        leaves = Array.from({ length: 14 }, (_, i) => ({ x: cols * hash(i + 80), y: rows * hash(i + 90), vy: 0.2 + hash(i + 95) * 0.3, s: hash(i + 99) }));
      }
    };

    /** Draw the shaded grayscale scene into the low-res buffer. */
    const paint = () => {
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.fillStyle = "#fff";
      lctx.fillRect(0, 0, cols, rows);
      const ground = rows * 0.92;

      if (scene === "horses") {
        const order = [...horses].sort((a, b) => a.z - b.z);
        for (const h of order) {
          const s = rows * 0.2 * (0.45 + 0.75 * h.z);
          const gy = ground - (1 - h.z) * rows * 0.28;
          const fade = (1 - h.z) * 0.55;
          // A soft shadow on the ground.
          lctx.setTransform(1, 0, 0, 1, 0, 0);
          lctx.fillStyle = ink(0.16, fade);
          lctx.beginPath();
          lctx.ellipse(h.x, gy, s * 1.3, s * 0.12, 0, 0, TAU);
          lctx.fill();
          lctx.setTransform(s, 0, 0, s, h.x, gy - s * 1.25);
          drawHorse(lctx, h.phase, fade);
        }
      }

      if (scene === "grove") {
        lctx.setTransform(1, 0, 0, 1, 0, 0);
        const field = lctx.createLinearGradient(0, rows * 0.7, 0, rows);
        field.addColorStop(0, ink(0.08));
        field.addColorStop(1, ink(0.3));
        lctx.fillStyle = field;
        lctx.fillRect(0, rows * 0.74, cols, rows);
        for (const t of trees) {
          const s = rows * (0.16 + t.z * 0.24) * t.h;
          const base = rows * (0.74 + t.z * 0.2);
          const near = pointer.on ? Math.exp(-(((pointer.x - t.x) / (cols * 0.18)) ** 2)) * Math.sign(t.x - pointer.x || 1) : 0;
          const sway = Math.sin(time * 0.9 + t.seed * 1.7) * 0.05 + Math.sin(time * 2.3 + t.seed) * 0.015 + near * 0.12;
          lctx.setTransform(s, 0, 0, s, t.x, base);
          drawTree(lctx, t, sway, (1 - t.z) * 0.6);
        }
        lctx.setTransform(1, 0, 0, 1, 0, 0);
        lctx.fillStyle = ink(0.7);
        for (const l of leaves) lctx.fillRect(Math.round(l.x), Math.round(l.y), 1, 1);
      }

      for (const b of birds) {
        const s = rows * (scene === "birds" ? 0.02 + b.z * 0.04 : 0.022);
        const tilt = Math.max(-0.5, Math.min(0.5, (b.vy / (Math.abs(b.vx) + 1)) * 0.5)) * Math.sign(b.vx || 1);
        lctx.setTransform(s, 0, 0, s, b.x, b.y);
        lctx.rotate(tilt);
        drawBird(lctx, b.glide > 0 ? 1.2 : b.flap, (1 - b.z) * 0.55);
      }
    };

    /** Ordered-dither the buffer into the inks and blit it, pixel-crisp, to the screen. */
    const present = () => {
      const src = lctx.getImageData(0, 0, cols, rows);
      const dst = octx.createImageData(cols, rows);
      const levels = inks.length;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const dark = 1 - src.data[i] / 255;
          const v = dark * levels;
          let level = Math.floor(v);
          if (v - level > BAYER[(y & 3) * 4 + (x & 3)]) level++;
          if (level <= 0) continue;
          const [r, g, b] = inks[Math.min(levels, level) - 1];
          dst.data[i] = r;
          dst.data[i + 1] = g;
          dst.data[i + 2] = b;
          dst.data[i + 3] = 255;
        }
      }
      octx.putImageData(dst, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(out, 0, 0, cols * cell * (canvas.width / root.clientWidth || 1), rows * cell * (canvas.height / root.clientHeight || 1));
    };

    const step = (dt: number) => {
      const k = live.current.speed;
      time += dt * k;
      if (scene === "horses") {
        for (const h of horses) {
          const s = rows * 0.2 * (0.45 + 0.75 * h.z);
          h.phase += dt * k * 6.2 * h.speed;
          h.x -= dt * k * s * 1.5 * h.speed;
          if (h.x < -rows * 0.24 * 2.5) {
            h.x += loop();
            h.z = 0.4 + hash(h.seed * 3 + Math.floor(time)) * 0.6;
          }
        }
      }
      if (scene === "grove") {
        for (const l of leaves) {
          l.y += dt * k * l.vy * 6;
          l.x += dt * k * Math.sin(time * 2 + l.s * 9) * 2;
          if (l.y > rows) {
            l.y = rows * 0.2;
            l.x = cols * hash(l.s * 100 + time);
          }
        }
      }
      const flock = scene === "birds";
      const cx = cols * (0.5 + 0.3 * Math.sin(time * 0.23));
      const cy = rows * (0.4 + 0.18 * Math.sin(time * 0.37 + 1));
      for (const b of birds) {
        if (flock) {
          // Drift toward a wandering point, keep some room, and scatter from the pointer.
          // Each bird keeps its own place in a loose, slowly turning formation.
          const turn = time * 0.15;
          const tx = cx + (b.ox * Math.cos(turn) - b.oy * Math.sin(turn) * 0.5) * cols;
          const ty = cy + (b.oy * Math.cos(turn) + b.ox * Math.sin(turn) * 0.3) * rows;
          let ax = (tx - b.x) * 0.02;
          let ay = (ty - b.y) * 0.03;
          const room = (rows * 0.06) ** 2;
          for (const o of birds) {
            if (o === b) continue;
            const dx = b.x - o.x;
            const dy = b.y - o.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < room && d2 > 0) {
              ax += (dx / d2) * room * 0.08;
              ay += (dy / d2) * room * 0.08;
            }
          }
          if (live.current.interactive && pointer.on) {
            const dx = b.x - pointer.x;
            const dy = b.y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < (rows * 0.3) ** 2) {
              ax += (dx / Math.sqrt(d2 + 1)) * 6;
              ay += (dy / Math.sqrt(d2 + 1)) * 6;
            }
          }
          b.vx += ax * dt * 4;
          b.vy += ay * dt * 4;
          const v = Math.hypot(b.vx, b.vy);
          const max = 7 + b.z * 6;
          if (v > max) {
            b.vx *= max / v;
            b.vy *= max / v;
          }
          b.x += b.vx * dt * k * 2;
          b.y += b.vy * dt * k * 2;
        } else {
          b.x += b.vx * dt * k * 6;
          b.y += Math.sin(time * 1.3 + b.flap) * dt * 0.8;
          if (b.x < -10) b.x = cols + 10;
          if (b.x > cols + 10) b.x = -10;
        }
        // Flap in bursts, then glide a moment.
        if (b.glide > 0) b.glide -= dt;
        else {
          b.flap += dt * k * b.rate;
          if (hash(Math.floor(time * 3) + b.rate * 100) > 0.985) b.glide = 0.6;
        }
      }
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!live.current.paused) step(dt);
      paint();
      present();
      schedule();
    };
    const schedule = () => {
      if (!frame && visible && !document.hidden && !reduceMotion) frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const w = Math.max(1, root.clientWidth);
      const h = Math.max(1, root.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const nextCols = Math.ceil(w / cell);
      const nextRows = Math.ceil(h / cell);
      const first = cols === 0;
      cols = low.width = out.width = nextCols;
      rows = low.height = out.height = nextRows;
      if (first) seedScene();
      paint();
      present();
    };

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / cell;
      pointer.y = (e.clientY - r.top) / cell;
      pointer.on = true;
    };
    const onLeave = () => {
      pointer.on = false;
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
  }, [scene, cell, count, toneKey]);

  return (
    <div ref={rootRef} className={cn("relative isolate overflow-hidden", className)} style={{ background, ...style }} {...props}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />
      {children}
    </div>
  );
}
