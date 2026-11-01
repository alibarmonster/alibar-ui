"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type WildlifeKind = "orca" | "turtle" | "birds" | "eagle";
export type BgTheme = "split" | "black" | "white";

export interface WildlifeSpec {
  kind: WildlifeKind;
  size: number;
}

const TAU = Math.PI * 2;
const NODES = 20;
const ALPHA_LEVELS = 6;
const BOID_ALPHAS = [0.28, 0.42, 0.58, 0.74, 0.9];

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const randInt = (lo: number, hi: number) => Math.floor(rand(lo, hi + 1));

function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

function angleDiff(a: number, b: number) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function hash3(x: number, y: number, z: number) {
  let h =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(z | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function flowField(x: number, y: number, t: number, out: { x: number; y: number }) {
  const K1 = 1 / 260;
  const K2 = 1 / 310;
  const K3 = 1 / 190;
  const SCALE = 3400;
  const a = x * K1 + t * 0.07;
  const b = y * K2 - t * 0.05;
  const c = (x + y) * K3 + t * 0.11;
  out.x = (-K2 * Math.sin(a) * Math.sin(b) + 0.5 * K3 * Math.cos(c)) * SCALE;
  out.y = (-K1 * Math.cos(a) * Math.cos(b) - 0.5 * K3 * Math.cos(c)) * SCALE;
  return out;
}

function inTriangle(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

const ACCENTS = ["#e0892c", "#e03a32", "#b44ae0", "#33c8cc", "#3cb54a", "#3150e8", "#d9c14a"];
const SKIN_RAMP = ":;t%SX8#@";
const FIN_GLYPHS = "%;tS:";
const RIDGE_GLYPHS = "@8%";
const MARK_GLYPHS = "#%@";
const EDGE_HEAVY = ":;";
const EDGE_LIGHT = ".',`";

const FLAG_BODY = 1;
const FLAG_EDGE = 2;
const FLAG_FIN = 3;
const FLAG_RIDGE = 4;
const FLAG_EYE = 5;
const FLAG_MARK = 6;

const SUBSAMPLES = [0.25, 0.3, 0.75, 0.3, 0.25, 0.72, 0.75, 0.72];
const KINDS: WildlifeKind[] = ["orca", "turtle", "birds", "eagle"];

const TINTS: Record<WildlifeKind, [number, number, number]> = {
  orca: [0.88, 0.96, 1.08],
  turtle: [0.82, 1.06, 0.86],
  birds: [0.9, 0.98, 1.12],
  eagle: [1.08, 0.94, 0.78],
};

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alarm: number;
  alive: boolean;
  respawnAt: number;
  turn: number;
  depth: number;
  glyph: string;
}

interface Creature {
  id: number;
  kind: WildlifeKind;
  length: number;
  nodes: Float32Array;
  heading: number;
  speed: number;
  phase: number;
  turn: number;
  hunger: number;
  wander: number;
  orbitDir: 1 | -1;
  orbitRadius: number;
  target: Boid | null;
  retargetAt: number;
  depth: number;
}

interface WorldEvent {
  kind: "eat" | "splash";
  x: number;
  y: number;
}

const DEFAULT_ROSTER: WildlifeSpec[] = [
  { kind: "orca", size: 1.0 },
  { kind: "eagle", size: 0.92 },
  { kind: "turtle", size: 0.78 },
  { kind: "birds", size: 0.56 },
  { kind: "birds", size: 0.5 },
];

class WildlifeWorld {
  width = 0;
  height = 0;
  time = 0;
  boids: Boid[] = [];
  creatures: Creature[] = [];
  events: WorldEvent[] = [];
  pointer = { x: 0, y: 0, active: false };
  private tmp = { x: 0, y: 0 };

  constructor(private specs: WildlifeSpec[] = DEFAULT_ROSTER) {}

  setSpecs(specs: WildlifeSpec[]) {
    this.specs = specs;
    if (this.width > 0 && this.height > 0) this.seed();
  }

  resize(width: number, height: number) {
    const first = this.width === 0;
    this.width = width;
    this.height = height;
    if (first || this.boids.length === 0) {
      this.seed();
      return;
    }
    for (const b of this.boids) {
      b.x = clamp(b.x, 0, width);
      b.y = clamp(b.y, 0, height);
    }
  }

  seed() {
    const { width: W, height: H } = this;
    const minSide = Math.min(W, H);
    const baseLength = clamp(minSide * 0.46, 145, 360);
    const count = this.specs.length;

    this.creatures = [];
    for (let i = 0; i < count; i++) {
      const { kind, size } = this.specs[i];
      const length = baseLength * size;
      const orbitRadius = minSide * rand(0.24, 0.38);
      const a = (i / count) * TAU + rand(-0.3, 0.3);
      const orbitDir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      const x = W / 2 + Math.cos(a) * orbitRadius * (W / minSide) * 0.85;
      const y = H / 2 + Math.sin(a) * orbitRadius;
      const heading = a + (orbitDir * Math.PI) / 2;
      const nodes = new Float32Array(NODES * 2);
      const seg = length / (NODES - 1);
      for (let n = 0; n < NODES; n++) {
        nodes[n * 2] = x - Math.cos(heading) * seg * n;
        nodes[n * 2 + 1] = y - Math.sin(heading) * seg * n;
      }
      this.creatures.push({
        id: i + 1,
        kind,
        length,
        nodes,
        heading,
        speed: kind === "turtle" ? 22 : kind === "birds" ? 48 : 34,
        phase: rand(0, TAU),
        turn: 0,
        hunger: rand(0.3, 0.8),
        wander: 0,
        orbitDir,
        orbitRadius,
        target: null,
        retargetAt: 0,
        depth: clamp(size, 0.55, 1),
      });
    }
    this.creatures.sort((a, b) => a.length - b.length);

    const total = clamp(Math.round((W * H) / 4200), 60, 220);
    const glyphs = ["-", "><", "^", "-"];
    this.boids = [];
    for (let i = 0; i < total; i++) {
      const dir = (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.45, 0.45);
      const speed = rand(28, 52);
      this.boids.push({
        x: rand(W * 0.05, W * 0.95),
        y: rand(H * 0.08, H * 0.92),
        vx: Math.cos(dir) * speed,
        vy: Math.sin(dir) * speed,
        alarm: 0,
        alive: true,
        respawnAt: 0,
        turn: 0,
        depth: rand(0.55, 1),
        glyph: glyphs[i % glyphs.length],
      });
    }
  }

  splash(x: number, y: number) {
    this.events.push({ kind: "splash", x, y });
    const r = 220;
    for (const b of this.boids) {
      if (!b.alive) continue;
      const dx = b.x - x;
      const dy = b.y - y;
      const d = Math.hypot(dx, dy);
      if (d > r || d < 1e-3) continue;
      const k = (1 - d / r) * 240;
      b.vx += (dx / d) * k;
      b.vy += (dy / d) * k;
      b.alarm = 1;
    }
  }

  step(dt: number) {
    this.time += dt;
    this.stepBoids(dt);
    this.stepCreatures(dt);
  }

  private stepBoids(dt: number) {
    const { boids, creatures, pointer, width: W, height: H, time } = this;
    const calmDecay = Math.exp(-dt * 0.8);
    const cur = this.tmp;

    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      if (!b.alive) {
        if (time >= b.respawnAt) {
          b.alive = true;
          b.x = Math.random() < 0.5 ? -10 : W + 10;
          b.y = rand(H * 0.1, H * 0.9);
          b.alarm = 0;
        }
        continue;
      }

      let ax = 0;
      let ay = 0;
      let fear = 0;

      for (const c of creatures) {
        const fearR = c.length * 0.55 + 50;
        let best = Infinity;
        let bx = 0;
        let by = 0;
        for (let k = 0; k <= 12; k += 4) {
          const nx = c.nodes[k * 2];
          const ny = c.nodes[k * 2 + 1];
          const d2 = (b.x - nx) ** 2 + (b.y - ny) ** 2;
          if (d2 < best) {
            best = d2;
            bx = nx;
            by = ny;
          }
        }
        const d = Math.sqrt(best);
        if (d < fearR && d > 1e-3) {
          const w = (1 - d / fearR) ** 2;
          const chx = Math.cos(c.heading);
          const chy = Math.sin(c.heading);
          const side = chx * (b.y - c.nodes[1]) - chy * (b.x - c.nodes[0]) >= 0 ? 1 : -1;
          ax += (((b.x - bx) / d) * 0.7 - chy * side * 0.9) * 950 * w;
          ay += (((b.y - by) / d) * 0.7 + chx * side * 0.9) * 950 * w;
          fear = Math.max(fear, Math.sqrt(w));
        }
      }

      if (pointer.active) {
        const dx = b.x - pointer.x;
        const dy = b.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < 120 && d > 1e-3) {
          const w = (1 - d / 120) ** 2;
          ax += (dx / d) * 900 * w;
          ay += (dy / d) * 900 * w;
          fear = Math.max(fear, w);
        }
      }

      b.alarm = Math.max(b.alarm * calmDecay, fear);
      flowField(b.x, b.y, time, cur);
      ax += cur.x * 0.45 + (Math.random() - 0.5) * 35;
      ay += cur.y * 0.45 - b.vy * 0.8 * (1 - 0.7 * b.alarm);

      const m = 32;
      if (b.x < m) ax += (m - b.x) * 6;
      else if (b.x > W - m) ax -= (b.x - (W - m)) * 6;
      if (b.y < m) ay += (m - b.y) * 6;
      else if (b.y > H - m) ay -= (b.y - (H - m)) * 6;

      const before = Math.atan2(b.vy, b.vx);
      b.vx += ax * dt;
      b.vy += ay * dt;
      const maxS = 68 * (1 + 1.5 * b.alarm);
      const s = Math.hypot(b.vx, b.vy) || 1;
      if (s > maxS) {
        b.vx = (b.vx / s) * maxS;
        b.vy = (b.vy / s) * maxS;
      } else if (s < 20) {
        b.vx = (b.vx / s) * 20;
        b.vy = (b.vy / s) * 20;
      }
      b.turn += (angleDiff(before, Math.atan2(b.vy, b.vx)) / dt - b.turn) * Math.min(1, dt * 8);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
  }

  private stepCreatures(dt: number) {
    const { creatures, width: W, height: H, time } = this;
    const minSide = Math.min(W, H) || 1;
    const cxW = W / 2;
    const cyW = H / 2;

    for (const c of creatures) {
      const L = c.length;
      const nodes = c.nodes;
      const hx = nodes[0];
      const hy = nodes[1];

      c.hunger = Math.min(1, c.hunger + dt * 0.04);

      let dx = Math.cos(c.heading);
      let dy = Math.sin(c.heading);

      c.wander = clamp(c.wander + (Math.random() - 0.5) * dt * 3.0, -1.1, 1.1);
      dx += Math.cos(c.heading + c.wander) * 0.45;
      dy += Math.sin(c.heading + c.wander) * 0.45;

      // Orbit patrol
      const rx = (hx - cxW) / (W / minSide);
      const ry = hy - cyW;
      const r = Math.hypot(rx, ry) || 1;
      const radius = c.orbitRadius * (1 + 0.15 * Math.sin(time * 0.06 + c.id));
      const radial = clamp((radius - r) / radius, -1, 1);
      dx += ((-ry / r) * c.orbitDir + (rx / r) * radial * 0.9) * 0.65;
      dy += ((rx / r) * c.orbitDir + (ry / r) * radial * 0.9) * 0.65;

      // Separation between creatures
      for (const other of creatures) {
        if (other === c) continue;
        for (let k = 0; k < NODES; k += 4) {
          const ox = hx - other.nodes[k * 2];
          const oy = hy - other.nodes[k * 2 + 1];
          const d = Math.hypot(ox, oy);
          const range = (L + other.length) * 0.42;
          if (d < range && d > 1e-3) {
            const w = (1 - d / range) * 2.8;
            dx += (ox / d) * w;
            dy += (oy / d) * w;
          }
        }
      }

      // Soft boundary return
      const over = Math.max(-hx, hx - W, -hy, hy - H);
      if (over > -L * 0.06) {
        const w = clamp((over + L * 0.06) / (L * 0.35), 0, 1) * 3.6;
        const toX = cxW - hx;
        const toY = cyW - hy;
        const d = Math.hypot(toX, toY) || 1;
        dx += (toX / d) * w;
        dy += (toY / d) * w;
      }

      const desired = Math.atan2(dy, dx);
      const baseCruise =
        c.kind === "turtle"
          ? 22 + L * 0.025
          : c.kind === "birds"
          ? 46 + L * 0.05
          : c.kind === "eagle"
          ? 38 + L * 0.04
          : 32 + L * 0.04;

      const agility = c.kind === "birds" ? 1.8 : c.kind === "eagle" ? 1.25 : 0.95;
      const maxTurn = agility * dt;
      const turned = clamp(angleDiff(c.heading, desired), -maxTurn, maxTurn);
      c.heading += turned;
      c.turn += (turned / dt - c.turn) * Math.min(1, dt * 3.5);
      c.speed += (baseCruise - c.speed) * Math.min(1, dt * 1.4);
      c.phase += dt * (c.kind === "birds" ? 4.2 : c.kind === "turtle" ? 2.1 : 2.6 + c.speed / 26);

      nodes[0] += Math.cos(c.heading) * c.speed * dt;
      nodes[1] += Math.sin(c.heading) * c.speed * dt;

      const seg = L / (NODES - 1);
      const maxBend = c.kind === "turtle" ? 0.08 : 0.15;
      let prevAngle = c.heading + Math.PI;
      for (let k = 1; k < NODES; k++) {
        const px = nodes[(k - 1) * 2];
        const py = nodes[(k - 1) * 2 + 1];
        let angle = Math.atan2(nodes[k * 2 + 1] - py, nodes[k * 2] - px);
        angle = prevAngle + clamp(angleDiff(prevAngle, angle), -maxBend, maxBend);
        nodes[k * 2] = px + Math.cos(angle) * seg;
        nodes[k * 2 + 1] = py + Math.sin(angle) * seg;
        prevAngle = angle;
      }

      // Feed on nearby boids
      const mouthR = L * 0.05 + 8;
      for (const b of this.boids) {
        if (!b.alive) continue;
        if ((b.x - nodes[0]) ** 2 + (b.y - nodes[1]) ** 2 < mouthR * mouthR) {
          b.alive = false;
          b.respawnAt = time + rand(3, 6);
          this.events.push({ kind: "eat", x: b.x, y: b.y });
        }
      }
    }
  }
}

class AsciiWildlifeRenderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private cw = 10;
  private ch = 15;
  private cols = 0;
  private rows = 0;
  private fontFamily = "ui-monospace, Menlo, monospace";
  public bgTheme: BgTheme = "split";

  private energy = new Float32Array(0);
  private energyTmp = new Float32Array(0);
  private heat = new Float32Array(0);

  private cellFlag = new Uint8Array(0);
  private cellShade = new Float32Array(0);
  private cellKey = new Uint32Array(0);
  private cellDepth = new Float32Array(0);
  private cellKind = new Uint8Array(0);
  private spine = new Float32Array(NODES * 2);
  private arc = new Float32Array(NODES);
  private arcTotal = 1;
  private activeKind: WildlifeKind = "orca";
  private activeId = 0;
  private activePhase = 0;
  private wingLeft = 0;
  private wingRight = 0;

  private hitFlag = 0;
  private hitShade = 0;
  private hitS = 0;
  private hitV = 0;
  private hitDist = 0;

  private boidStamp = new Uint32Array(0);
  private frameId = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
  }

  resize(width: number, height: number, dpr: number) {
    const prevCols = this.cols;
    const prevRows = this.rows;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.cw = clamp(Math.round(width / 88), 8, 12);
    this.ch = Math.round(this.cw * 1.45);
    this.cols = Math.ceil(width / this.cw);
    this.rows = Math.ceil(height / this.ch);

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);

    const n = this.cols * this.rows;
    if (this.cols !== prevCols || this.rows !== prevRows) {
      this.energy = new Float32Array(n);
      this.energyTmp = new Float32Array(n);
      this.heat = new Float32Array(n);
      this.cellFlag = new Uint8Array(n);
      this.cellShade = new Float32Array(n);
      this.cellKey = new Uint32Array(n);
      this.cellDepth = new Float32Array(n);
      this.cellKind = new Uint8Array(n);
      this.boidStamp = new Uint32Array(n);
    }
  }

  private isLightCell(col: number): boolean {
    if (this.bgTheme === "white") return true;
    if (this.bgTheme === "black") return false;
    return col >= Math.floor(this.cols * 0.5);
  }

  private paintBackground() {
    const { ctx, width: W, height: H, dpr, cw, ch, cols, rows, bgTheme } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (bgTheme === "black") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);
    } else if (bgTheme === "white") {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);
    } else {
      const splitX = Math.floor(cols * 0.5) * cw;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, splitX, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(splitX, 0, W - splitX, H);
    }

    // Crisp pixel-snapped grid lines for dark and light regions
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      const x = Math.round(c * cw) + 0.5;
      ctx.strokeStyle = this.isLightCell(c)
        ? "rgba(15,23,42,0.075)"
        : "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      const y = Math.round(r * ch) + 0.5;
      if (bgTheme === "split") {
        const splitX = Math.floor(cols * 0.5) * cw;
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(splitX, y);
        ctx.stroke();

        ctx.strokeStyle = "rgba(15,23,42,0.075)";
        ctx.beginPath();
        ctx.moveTo(splitX, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      } else {
        ctx.strokeStyle = bgTheme === "white" ? "rgba(15,23,42,0.075)" : "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }
  }

  render(world: WildlifeWorld, dt: number) {
    const { ctx, cols, ch } = this;
    if (cols === 0) return;
    const t = world.time;

    this.consumeEvents(world);
    this.rasterizeCreatures(world.creatures, t);
    this.depositWake(world);
    this.diffuse(dt);

    this.paintBackground();

    ctx.font = `600 ${Math.round(ch * 0.74)}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this.drawWakeDots();
    this.drawHeat();
    this.drawBoids(world);
    this.drawCreatures(t);
  }

  private cellIndex(x: number, y: number) {
    const c = Math.floor(x / this.cw);
    const r = Math.floor(y / this.ch);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
    return r * this.cols + c;
  }

  private stamp(field: Float32Array, x: number, y: number, radius: number, amount: number) {
    const c0 = Math.floor(x / this.cw);
    const r0 = Math.floor(y / this.ch);
    for (let r = r0 - radius; r <= r0 + radius; r++) {
      for (let c = c0 - radius; c <= c0 + radius; c++) {
        if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) continue;
        const d = Math.hypot(c - c0, (r - r0) * 1.4);
        if (d > radius + 0.5) continue;
        const i = r * this.cols + c;
        field[i] = Math.min(1.6, field[i] + amount * (1 - d / (radius + 1)));
      }
    }
  }

  private consumeEvents(world: WildlifeWorld) {
    for (const e of world.events) {
      if (e.kind === "eat") {
        this.stamp(this.heat, e.x, e.y, 2, 1);
        this.stamp(this.energy, e.x, e.y, 3, 0.9);
      } else {
        this.stamp(this.energy, e.x, e.y, 6, 1.4);
      }
    }
    world.events.length = 0;
  }

  private depositWake(world: WildlifeWorld) {
    const { energy } = this;
    for (const b of world.boids) {
      if (!b.alive) continue;
      const i = this.cellIndex(b.x, b.y);
      if (i >= 0) energy[i] = Math.min(1.6, energy[i] + 0.015 + b.alarm * 0.03);
    }
    for (const c of world.creatures) {
      for (let k = NODES - 6; k < NODES; k++) {
        const i = this.cellIndex(c.nodes[k * 2], c.nodes[k * 2 + 1]);
        if (i >= 0) energy[i] = Math.min(1.6, energy[i] + 0.055 + c.speed * 0.0012);
      }
    }
    if (world.pointer.active) {
      this.stamp(energy, world.pointer.x, world.pointer.y, 2, 0.12);
    }
  }

  private diffuse(dt: number) {
    const { cols, rows, energy, energyTmp: tmp, heat } = this;
    const decay = Math.exp(-dt * 1.5);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const l = c > 0 ? energy[i - 1] : energy[i];
        const rt = c < cols - 1 ? energy[i + 1] : energy[i];
        const u = r > 0 ? energy[i - cols] : energy[i];
        const d = r < rows - 1 ? energy[i + cols] : energy[i];
        tmp[i] = (energy[i] * 4 + l + rt + u + d) * 0.125 * decay;
      }
    }
    this.energy = tmp;
    this.energyTmp = energy;
    const heatDecay = Math.exp(-dt * 2.2);
    for (let i = 0; i < heat.length; i++) heat[i] *= heatDecay;
  }

  /**
   * Species-specific anatomical SDF & fin/wing/carapace sampler:
   * - orca: blunt rostrum, paddle flippers, tall dorsal fin, white eye/flank saddle markings, broad tail flukes
   * - turtle: domed oval carapace with hexagonal scutes, flapping sea-paddle flippers, rounded head
   * - birds: sleek swallow body, swept delta wings with cyclic wingbeat, forked swallow tail
   * - eagle: hooked raptor beak, white head & fanned tail, broad soaring wings with slotted primary feathers
   */
  private sampleCreature(px: number, py: number, L: number) {
    const { spine, arc, activeKind } = this;
    let best = Infinity;
    let bestS = 0;
    let bestSign = 1;
    let bestNx = 0;
    let bestNy = 0;

    for (let k = 0; k < NODES - 1; k++) {
      const ax = spine[k * 2];
      const ay = spine[k * 2 + 1];
      const sx = spine[(k + 1) * 2] - ax;
      const sy = spine[(k + 1) * 2 + 1] - ay;
      const len2 = sx * sx + sy * sy || 1;
      const u = clamp(((px - ax) * sx + (py - ay) * sy) / len2, 0, 1);
      const qx = ax + sx * u;
      const qy = ay + sy * u;
      const d2 = (px - qx) ** 2 + (py - qy) ** 2;
      if (d2 < best) {
        best = d2;
        const len = Math.sqrt(len2);
        bestS = (arc[k] + u * len) / this.arcTotal;
        bestSign = sx * (py - ay) - sy * (px - ax) >= 0 ? 1 : -1;
        bestNx = (-sy / len) * bestSign;
        bestNy = (sx / len) * bestSign;
      }
    }

    const a = Math.sqrt(best);
    const s = bestS;
    const u = s * L;
    this.hitDist = a;
    this.hitS = s;
    this.hitV = a * bestSign;

    // 1. ORCA (Killer Whale)
    if (activeKind === "orca") {
      let hw = 0;
      if (s < 0.14) hw = 0.105 * Math.pow(Math.sin(((s / 0.14) * Math.PI) / 2), 0.75);
      else if (s < 0.34) hw = 0.105 + 0.02 * smoothstep(0.14, 0.34, s);
      else if (s < 0.84) hw = 0.018 + 0.107 * Math.pow(1 - (s - 0.34) / 0.5, 1.2);
      else hw = 0.018 * (1 - (s - 0.84) / 0.16);

      const w = hw * L;
      if (a <= w) {
        const across = a / (w || 1);
        const facing = (bestNx * -0.6 + bestNy * -0.8) * across;
        let shade = 0.52 - across * across * 0.38 + facing * 0.25;
        let flag = FLAG_BODY;

        if (s > 0.38 && s < 0.52 && across < 0.28) {
          flag = FLAG_RIDGE;
          shade = 1.0;
        } else if (s > 0.07 && s < 0.11 && across > 0.62) {
          flag = FLAG_EYE;
          shade = 0;
        } else if (
          // Iconic Orca white eye patch, flank patch, and dorsal saddle patch
          (s > 0.1 && s < 0.21 && across > 0.45 && across < 0.88) ||
          (s > 0.52 && s < 0.76 && across > 0.52) ||
          (s > 0.48 && s < 0.59 && across > 0.22 && across < 0.55)
        ) {
          flag = FLAG_RIDGE;
          shade = 0.95;
        }
        this.hitFlag = flag;
        this.hitShade = shade;
        return true;
      }

      // Rounded Orca pectoral paddles & broad horizontal tail flukes
      const tip = bestSign > 0 ? this.wingRight : this.wingLeft;
      if (
        inTriangle(u, a, L * 0.18, 0, L * 0.38, 0, L * 0.34, tip) ||
        inTriangle(u, a, L * 0.84, 0, L * 0.98, 0, L * 0.99, L * 0.22)
      ) {
        this.hitFlag = FLAG_FIN;
        this.hitShade = 0.42;
        return true;
      }
      return false;
    }

    // 2. SEA TURTLE
    if (activeKind === "turtle") {
      let hw = 0;
      if (s < 0.16) {
        // Rounded turtle head + neck constriction
        hw = s < 0.11 ? 0.058 * Math.sin((s / 0.11) * Math.PI * 0.75) : 0.042;
      } else if (s < 0.82) {
        // Wide domed oval carapace shell
        const cs = (s - 0.16) / 0.66;
        hw = 0.04 + 0.21 * Math.pow(Math.sin(cs * Math.PI), 0.78);
      } else {
        hw = 0.025 * (1 - (s - 0.82) / 0.18);
      }

      const w = hw * L;
      if (a <= w) {
        const across = a / (w || 1);
        const facing = (bestNx * -0.6 + bestNy * -0.8) * across;
        let shade = 0.62 - across * across * 0.38 + facing * 0.22;
        let flag = FLAG_BODY;

        if (s > 0.04 && s < 0.08 && across > 0.6) {
          flag = FLAG_EYE;
          shade = 0;
        } else if (s > 0.18 && s < 0.78) {
          // Carapace scute hexagonal lattice pattern
          const gu = s * 9.5;
          const gv = (a / L) * 14.0;
          const rim = Math.abs(Math.sin(gu * Math.PI)) < 0.18 || Math.abs(Math.sin(gv * Math.PI)) < 0.18;
          if (across < 0.13) {
            flag = FLAG_RIDGE;
            shade = 0.92;
          } else if (rim || across > 0.88) {
            flag = FLAG_MARK;
            shade = 0.28;
          }
        }
        this.hitFlag = flag;
        this.hitShade = shade;
        return true;
      }

      // Sweeping sea-turtle front paddles (stroke forward/back with phase) & hind flippers
      const stroke = Math.sin(this.activePhase) * 0.09;
      const tip = bestSign > 0 ? this.wingRight : this.wingLeft;
      if (
        inTriangle(u, a, L * 0.18, 0, L * 0.34, 0, L * (0.28 + stroke), tip) ||
        inTriangle(u, a, L * 0.68, 0, L * 0.81, 0, L * 0.86, L * 0.14)
      ) {
        this.hitFlag = FLAG_FIN;
        this.hitShade = 0.48;
        return true;
      }
      return false;
    }

    // 3. BIRDS (Swallow / Swift Flock)
    if (activeKind === "birds") {
      let hw = 0;
      if (s < 0.12) hw = 0.055 * (s / 0.12);
      else if (s < 0.68) hw = 0.065 * (1 - (s - 0.12) / 0.65);
      else hw = 0.022;

      const w = hw * L;
      if (a <= w) {
        const across = a / (w || 1);
        this.hitFlag = s < 0.06 ? FLAG_RIDGE : FLAG_BODY;
        this.hitShade = 0.68 - across * 0.3;
        return true;
      }

      const tip = bestSign > 0 ? this.wingRight : this.wingLeft;
      // Swept-back crescent wings + deeply forked swallow tail
      if (
        inTriangle(u, a, L * 0.16, 0, L * 0.46, 0, L * 0.54, tip) &&
        !inTriangle(u, a, L * 0.46, 0, L * 0.48, tip * 0.55, L * 0.54, tip)
      ) {
        this.hitFlag = a > tip * 0.65 ? FLAG_RIDGE : FLAG_FIN;
        this.hitShade = 0.58;
        return true;
      }
      if (inTriangle(u, a, L * 0.68, 0, L * 0.88, 0, L * 0.99, L * 0.12)) {
        this.hitFlag = FLAG_FIN;
        this.hitShade = 0.46;
        return true;
      }
      return false;
    }

    // 4. EAGLE (Apex Soaring Raptor)
    let hw = 0;
    if (s < 0.12) hw = 0.068 * Math.pow(s / 0.12, 0.7);
    else if (s < 0.7) hw = 0.088 * (1 - ((s - 0.12) / 0.58) * 0.65);
    else {
      // Fanned wedge tail feathers
      const ts = (s - 0.7) / 0.3;
      hw = 0.032 + 0.115 * ts;
    }

    const w = hw * L;
    if (a <= w) {
      const across = a / (w || 1);
      let flag = FLAG_BODY;
      let shade = 0.56 - across * 0.28;

      if (s > 0.05 && s < 0.09 && across > 0.58) {
        flag = FLAG_EYE;
        shade = 0;
      } else if (s < 0.19 || s > 0.73) {
        // White hooded eagle head & white fanned tail feathers
        flag = FLAG_RIDGE;
        shade = 0.96;
      }
      this.hitFlag = flag;
      this.hitShade = shade;
      return true;
    }

    // Broad soaring raptor wings with slotted primary wingtip feathers
    const tip = bestSign > 0 ? this.wingRight : this.wingLeft;
    if (u >= L * 0.15 && u <= L * 0.62 && a <= tip) {
      const r = a / (tip || 1);
      const lead = L * (0.16 + 0.12 * r * r);
      const trail = L * (0.56 - 0.12 * r);
      if (r > 0.72) {
        // Slotted primary feather fingers at wingtips
        const finger = Math.sin(((u - lead) / (L * 0.055)) * Math.PI * 2);
        if (finger < -0.15) return false;
      }
      if (u >= lead && u <= trail) {
        const featherBar = Math.sin(r * 18.0) > 0.55;
        this.hitFlag = featherBar ? FLAG_MARK : r < 0.3 ? FLAG_BODY : FLAG_FIN;
        this.hitShade = 0.46 + 0.28 * (1 - r);
        return true;
      }
    }
    return false;
  }

  private rasterizeCreatures(creatures: Creature[], t: number) {
    const { cellFlag, cellShade, cellKey, cellDepth, cellKind, spine, arc, cw, ch, cols, rows } = this;
    cellFlag.fill(0);

    for (const c of creatures) {
      const L = c.length;
      const n = c.nodes;
      this.activeKind = c.kind;
      this.activeId = c.id;
      this.activePhase = c.phase;
      const kindIndex = KINDS.indexOf(c.kind);

      const waveScale = c.kind === "turtle" ? 0.015 : c.kind === "eagle" ? 0.02 : 0.045;
      for (let k = 0; k < NODES; k++) {
        const s = k / (NODES - 1);
        const a = Math.max(0, k - 1);
        const b = Math.min(NODES - 1, k + 1);
        let tx = n[a * 2] - n[b * 2];
        let ty = n[a * 2 + 1] - n[b * 2 + 1];
        const tl = Math.hypot(tx, ty) || 1;
        tx /= tl;
        ty /= tl;
        const amp = L * waveScale * (0.1 + 0.9 * Math.pow(s, 1.7));
        const off = amp * Math.sin(c.phase - s * 5.0);
        spine[k * 2] = n[k * 2] - ty * off;
        spine[k * 2 + 1] = n[k * 2 + 1] + tx * off;
      }

      arc[0] = 0;
      for (let k = 1; k < NODES; k++) {
        arc[k] =
          arc[k - 1] +
          Math.hypot(spine[k * 2] - spine[(k - 1) * 2], spine[k * 2 + 1] - spine[(k - 1) * 2 + 1]);
      }
      this.arcTotal = arc[NODES - 1] || 1;

      const bank = clamp(c.turn * 0.4, -0.32, 0.32);
      const baseReach =
        c.kind === "eagle"
          ? 0.44 * (0.86 + 0.14 * Math.sin(c.phase))
          : c.kind === "birds"
          ? 0.35 * (0.72 + 0.28 * Math.sin(c.phase * 1.4))
          : c.kind === "turtle"
          ? 0.32
          : 0.23;

      this.wingRight = L * baseReach * (1 - bank);
      this.wingLeft = L * baseReach * (1 + bank);

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let k = 0; k < NODES; k++) {
        minX = Math.min(minX, spine[k * 2]);
        maxX = Math.max(maxX, spine[k * 2]);
        minY = Math.min(minY, spine[k * 2 + 1]);
        maxY = Math.max(maxY, spine[k * 2 + 1]);
      }
      const reach = L * 0.48;
      const c0 = Math.max(0, Math.floor((minX - reach) / cw));
      const c1 = Math.min(cols - 1, Math.floor((maxX + reach) / cw));
      const r0 = Math.max(0, Math.floor((minY - reach) / ch));
      const r1 = Math.min(rows - 1, Math.floor((maxY + reach) / ch));
      if (c0 > c1 || r0 > r1) continue;

      const skipBeyond = reach + Math.hypot(cw, ch);

      for (let r = r0; r <= r1; r++) {
        for (let col = c0; col <= c1; col++) {
          const x = col * cw;
          const y = r * ch;
          const centerHit = this.sampleCreature(x + cw / 2, y + ch / 2, L);
          if (!centerHit && this.hitDist > skipBeyond) continue;
          const flag = this.hitFlag;
          const shade = this.hitShade;
          const s = this.hitS;
          const v = this.hitV;

          let hits = centerHit ? 1 : 0;
          for (let k = 0; k < SUBSAMPLES.length; k += 2) {
            if (this.sampleCreature(x + SUBSAMPLES[k] * cw, y + SUBSAMPLES[k + 1] * ch, L)) hits++;
          }
          if (hits === 0) continue;
          const coverage = hits / 5;

          const i = r * cols + col;
          const key = (hash3(Math.round(s * 52), Math.round(v / (cw * 0.9)), c.id) * 4294967295) >>> 0;
          cellKey[i] = key;
          cellDepth[i] = c.depth;
          cellKind[i] = kindIndex;

          if (centerHit && coverage >= 0.6) {
            cellFlag[i] = flag;
            const flicker = (hash3(col, r, Math.floor(t * 6)) - 0.5) * 0.06;
            cellShade[i] = clamp(shade + flicker, 0, 1);
          } else {
            cellFlag[i] = FLAG_EDGE;
            cellShade[i] = coverage;
          }
        }
      }
    }
  }

  private drawCreatures(t: number) {
    const { ctx, cols, rows, cw, ch, cellFlag, cellShade, cellKey, cellDepth, cellKind } = this;
    const n = cols * rows;

    for (let i = 0; i < n; i++) {
      const flag = cellFlag[i];
      if (!flag) continue;
      const col = i % cols;
      const row = (i / cols) | 0;
      const x = col * cw;
      const y = row * ch;
      const key = cellKey[i];
      const shade = cellShade[i];
      const dim = 0.72 + 0.28 * cellDepth[i];
      const [tr, tg, tb] = TINTS[KINDS[cellKind[i]]];
      const isLight = this.isLightCell(col);

      const tick = Math.floor(t * 2.4 + (key % 997) / 97);
      const roll = hash3(key, tick, 7);

      if (flag === FLAG_EDGE) {
        const set = shade >= 0.5 ? EDGE_HEAVY : EDGE_LIGHT;
        if (roll < 0.08) {
          ctx.fillStyle = ACCENTS[key % ACCENTS.length];
        } else if (isLight) {
          const g = Math.round((155 - shade * 95) * (2 - dim));
          ctx.fillStyle = `rgb(${g},${g},${g})`;
        } else {
          const g = (75 + shade * 85) * dim;
          ctx.fillStyle = `rgb(${Math.round(g * tr)},${Math.round(g * tg)},${Math.min(255, Math.round(g * tb + 6))})`;
        }
        ctx.fillText(set[(key >>> 8) % set.length], x + cw / 2, y + ch / 2 + 1);
        continue;
      }

      let level: number;
      let glyph: string;
      if (flag === FLAG_RIDGE) {
        level = 232;
        glyph = RIDGE_GLYPHS[(key >>> 8) % RIDGE_GLYPHS.length];
      } else if (flag === FLAG_EYE) {
        level = 14;
        glyph = "o";
      } else if (flag === FLAG_MARK) {
        level = 28 + shade * 26;
        glyph = MARK_GLYPHS[(key >>> 8) % MARK_GLYPHS.length];
      } else if (flag === FLAG_FIN) {
        level = 46 + shade * 120;
        glyph = FIN_GLYPHS[(key >>> 8) % FIN_GLYPHS.length];
      } else {
        level = 52 + shade * 155;
        const jitter = ((key >>> 4) % 3) - 1;
        glyph = SKIN_RAMP[clamp(Math.floor((1 - shade) * 8.99) + jitter, 0, SKIN_RAMP.length - 1)];
      }

      if (isLight) {
        // High-contrast ink-on-paper block shading for white background
        const invLevel = flag === FLAG_RIDGE ? 242 : clamp(235 - level * 0.85, 22, 228);
        ctx.fillStyle = `rgb(${Math.round(invLevel * (2 - tr * 0.9))},${Math.round(invLevel * (2 - tg * 0.9))},${Math.round(invLevel * (2 - tb * 0.9))})`;
        ctx.fillRect(x + 1, y + 1, cw - 1, ch - 1);

        let color: string;
        if (flag === FLAG_EYE) color = "#f8fafc";
        else if (roll < 0.11) color = ACCENTS[key % ACCENTS.length];
        else color = invLevel < 110 ? "#f8fafc" : "#0f172a";
        ctx.fillStyle = color;
        ctx.fillText(glyph, x + cw / 2, y + ch / 2 + 1);
      } else {
        level *= dim;
        ctx.fillStyle = `rgb(${Math.min(255, Math.round(level * tr))},${Math.min(255, Math.round(level * tg))},${Math.min(255, Math.round(level * tb + 4))})`;
        ctx.fillRect(x + 1, y + 1, cw - 1, ch - 1);

        let color: string;
        if (flag === FLAG_EYE) color = "#9aa0ad";
        else if (flag === FLAG_MARK) color = `rgb(${Math.round(75 * tr)},${Math.round(75 * tg)},${Math.round(75 * tb)})`;
        else if (roll < 0.09) color = ACCENTS[key % ACCENTS.length];
        else if (roll < 0.13) color = "#ffffff";
        else color = shade > 0.55 ? "#0e0f13" : "#1b1d24";
        ctx.fillStyle = color;
        ctx.fillText(glyph, x + cw / 2, y + ch / 2 + 1);
      }
    }
  }

  private drawWakeDots() {
    const { ctx, cols, cw, ch, energy, cellFlag } = this;
    const size = Math.max(2, Math.round(cw * 0.22));
    for (let i = 0; i < energy.length; i++) {
      const e = energy[i];
      if (cellFlag[i] || e < 0.35) continue;
      const col = i % cols;
      const row = (i / cols) | 0;
      const a = clamp((e - 0.35) * 0.85, 0.12, 0.92);
      const isLight = this.isLightCell(col);
      ctx.fillStyle = isLight
        ? `rgba(14,116,144,${a.toFixed(2)})`
        : `rgba(110,230,255,${a.toFixed(2)})`;
      ctx.fillRect(
        Math.round(col * cw + cw * 0.66 - size / 2),
        Math.round(row * ch + ch * 0.64 - size / 2),
        size,
        size
      );
    }
  }

  private drawBoids(world: WildlifeWorld) {
    const { ctx, cw, ch, cols, boidStamp, cellFlag } = this;
    const frame = ++this.frameId;
    for (const b of world.boids) {
      if (!b.alive) continue;
      const i = this.cellIndex(b.x, b.y);
      if (i < 0 || boidStamp[i] === frame || cellFlag[i]) continue;
      boidStamp[i] = frame;
      const col = i % cols;
      const row = (i / cols) | 0;
      const glint = clamp(Math.abs(b.turn) / 3.5, 0, 1);
      const v = 0.3 + (0.4 * (b.depth - 0.55)) / 0.45 + 0.3 * Math.max(glint, b.alarm);
      const alpha = BOID_ALPHAS[clamp(Math.floor(v * BOID_ALPHAS.length), 0, BOID_ALPHAS.length - 1)];
      const isLight = this.isLightCell(col);
      ctx.fillStyle = isLight
        ? `rgba(15,23,42,${alpha})`
        : `rgba(226,236,255,${alpha})`;
      ctx.fillText(b.glyph, col * cw + cw / 2, row * ch + ch / 2 + 1);
    }
  }

  private drawHeat() {
    const { ctx, heat, cols, cw, ch } = this;
    for (let i = 0; i < heat.length; i++) {
      const h = heat[i];
      if (h < 0.08) continue;
      const col = i % cols;
      const row = (i / cols) | 0;
      ctx.fillStyle = h > 0.5 ? `rgba(255,120,60,${h.toFixed(2)})` : `rgba(220,40,40,${(h * 1.6).toFixed(2)})`;
      ctx.fillText(h > 0.6 ? "*" : "·", col * cw + cw / 2, row * ch + ch / 2 + 1);
    }
  }
}

const PRESET_SPECS: Record<string, WildlifeSpec[]> = {
  all: DEFAULT_ROSTER,
  orca: [
    { kind: "orca", size: 1.0 },
    { kind: "orca", size: 0.78 },
    { kind: "orca", size: 0.66 },
  ],
  turtle: [
    { kind: "turtle", size: 0.96 },
    { kind: "turtle", size: 0.76 },
    { kind: "turtle", size: 0.64 },
  ],
  birds: [
    { kind: "birds", size: 0.68 },
    { kind: "birds", size: 0.6 },
    { kind: "birds", size: 0.54 },
    { kind: "birds", size: 0.5 },
    { kind: "birds", size: 0.46 },
  ],
  eagle: [
    { kind: "eagle", size: 1.0 },
    { kind: "eagle", size: 0.82 },
    { kind: "eagle", size: 0.68 },
  ],
};

export function AsciiWildlifeSim({
  speed = 1,
  defaultTheme = "split",
  className,
}: {
  speed?: number;
  defaultTheme?: BgTheme;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<WildlifeWorld | null>(null);
  const rendererRef = useRef<AsciiWildlifeRenderer | null>(null);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  });

  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [bgTheme, setBgTheme] = useState<BgTheme>(defaultTheme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const world = new WildlifeWorld(PRESET_SPECS[speciesFilter]);
    const renderer = new AsciiWildlifeRenderer(canvas);
    renderer.bgTheme = bgTheme;
    worldRef.current = world;
    rendererRef.current = renderer;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.resize(rect.width, rect.height, dpr);
      world.resize(rect.width, rect.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      world.pointer.x = x;
      world.pointer.y = y;
      world.pointer.active = inside;
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        world.splash(x, y);
      }
    };

    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerdown", onPointerDown, { passive: true });

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1 / 60;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) {
        last = now;
        return;
      }
      const dt = Math.min(0.1, ((now - last) / 1000) * speedRef.current);
      last = now;
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 4) {
        world.step(STEP);
        acc -= STEP;
        steps++;
      }
      if (steps === 4) acc = 0;
      renderer.render(world, dt);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.setSpecs(PRESET_SPECS[speciesFilter] ?? DEFAULT_ROSTER);
    }
  }, [speciesFilter]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.bgTheme = bgTheme;
    }
  }, [bgTheme]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden select-none", className)}>
      <canvas
        ref={canvasRef}
        className="h-full w-full block cursor-crosshair font-mono"
        aria-label="ASCII Wildlife Boids & Spine Simulation (Orca, Turtle, Birds, Eagle)"
      />

      {/* Interactive Species & Black/White Theme Switcher */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 pointer-events-auto">
          {[
            { id: "all", label: "All" },
            { id: "orca", label: "Orca" },
            { id: "turtle", label: "Turtle" },
            { id: "birds", label: "Birds" },
            { id: "eagle", label: "Eagle" },
          ].map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => setSpeciesFilter(sp.id)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer",
                speciesFilter === sp.id
                  ? "bg-[#c8ff4d] text-black font-semibold"
                  : "text-zinc-300 hover:text-white"
              )}
            >
              {sp.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 pointer-events-auto">
          {[
            { id: "split", label: "Split B/W" },
            { id: "black", label: "Black" },
            { id: "white", label: "White" },
          ].map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setBgTheme(th.id as BgTheme)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer",
                bgTheme === th.id
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-300 hover:text-white"
              )}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
