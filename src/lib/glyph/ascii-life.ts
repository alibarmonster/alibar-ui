/**
 * Building blocks for ASCII creatures on a canvas: a grid of glyph cells (taller than wide, like
 * monospace glyphs), a diffusing wake field, follow-the-leader spines with a bend limit and a
 * travelling body wave, nearest-point queries in body coordinates, and a cell buffer that is drawn
 * in two batched passes (shaded blocks grouped by color, then glyphs blitted from a sprite atlas).
 *
 * The approach (shaded blocks under density-matched glyphs, supersampled silhouettes, a wake field
 * that lights the water, glyphs keyed to body coordinates) is learned from ascii-sharks by drewdi,
 * https://github.com/stackedlol/ascii-sharks (MIT). This file is an independent implementation.
 */
import type { GlyphAtlas } from "@/lib/glyph/glyph-atlas";

/* ------------------------------------------------------------------ grid */

export interface CellGrid {
  /** Cell width and height in CSS pixels. */
  cw: number;
  ch: number;
  cols: number;
  rows: number;
}

/** A grid of cells `cell` wide and `cell × aspect` tall covering width × height. */
export function cellGrid(width: number, height: number, cell: number, aspect = 1.45): CellGrid {
  const cw = Math.max(4, cell);
  const ch = Math.max(4, Math.round(cw * aspect));
  return { cw, ch, cols: Math.max(1, Math.ceil(width / cw)), rows: Math.max(1, Math.ceil(height / ch)) };
}

export const cellAt = (g: CellGrid, x: number, y: number) => {
  const c = Math.floor(x / g.cw);
  const r = Math.floor(y / g.ch);
  return c < 0 || r < 0 || c >= g.cols || r >= g.rows ? -1 : r * g.cols + c;
};

/* ------------------------------------------------------------------ hashing */

/** Integer hash → [0, 1). Stable, so textures keyed to it don't flicker. */
export function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x | 0, 0x2c1b3c6d) ^ Math.imul(y | 0, 0x297a2d39) ^ Math.imul(z | 0, 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/* ------------------------------------------------------------------ wake field */

/**
 * Energy per cell that things deposit as they swim. Each step it blurs into its neighbors and
 * decays, so wakes spread like ripples and fade.
 */
export class WakeField {
  energy: Float32Array;
  private tmp: Float32Array;

  constructor(
    readonly cols: number,
    readonly rows: number,
  ) {
    this.energy = new Float32Array(cols * rows);
    this.tmp = new Float32Array(cols * rows);
  }

  add(index: number, amount: number, max = 1.6) {
    if (index >= 0) this.energy[index] = Math.min(max, this.energy[index] + amount);
  }

  /** A soft disc of energy around (x, y), `radius` cells wide (rows count wider, cells are tall). */
  stamp(g: CellGrid, x: number, y: number, radius: number, amount: number) {
    const c0 = Math.floor(x / g.cw);
    const r0 = Math.floor(y / g.ch);
    const rr = Math.ceil(radius / 1.4);
    for (let r = r0 - rr; r <= r0 + rr; r++) {
      for (let c = c0 - radius; c <= c0 + radius; c++) {
        if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) continue;
        const d = Math.hypot(c - c0, (r - r0) * 1.4);
        if (d <= radius + 0.5) this.add(r * this.cols + c, amount * (1 - d / (radius + 1)));
      }
    }
  }

  /** A thin ring of energy, for splashes and dropped food. */
  ring(g: CellGrid, x: number, y: number, radiusPx: number, amount: number) {
    const steps = Math.max(8, Math.ceil((radiusPx * Math.PI * 2) / g.cw));
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      this.add(cellAt(g, x + Math.cos(a) * radiusPx, y + Math.sin(a) * radiusPx * 0.9), amount);
    }
  }

  step(dt: number, decayPerSecond = 1.5) {
    const { cols, rows, energy: e, tmp } = this;
    const decay = Math.exp(-dt * decayPerSecond);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const l = c > 0 ? e[i - 1] : e[i];
        const rt = c < cols - 1 ? e[i + 1] : e[i];
        const u = r > 0 ? e[i - cols] : e[i];
        const d = r < rows - 1 ? e[i + cols] : e[i];
        tmp[i] = (e[i] * 4 + l + rt + u + d) * 0.125 * decay;
      }
    }
    this.tmp = e;
    this.energy = tmp;
  }
}

/* ------------------------------------------------------------------ spines */

const angleDiff = (a: number, b: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

/**
 * Pulls every node after the head to `segment` px behind the one before it, bending at most
 * `maxBend` radians per joint, so a body curls into a C but never folds back on itself.
 */
export function followSpine(nodes: Float32Array, heading: number, segment: number, maxBend: number) {
  let prev = heading + Math.PI;
  for (let k = 1; k < nodes.length / 2; k++) {
    const px = nodes[(k - 1) * 2];
    const py = nodes[(k - 1) * 2 + 1];
    let angle = Math.atan2(nodes[k * 2 + 1] - py, nodes[k * 2] - px);
    angle = prev + Math.max(-maxBend, Math.min(maxBend, angleDiff(prev, angle)));
    nodes[k * 2] = px + Math.cos(angle) * segment;
    nodes[k * 2 + 1] = py + Math.sin(angle) * segment;
    prev = angle;
  }
}

/** A straight spine from (x, y) trailing back from `heading`. */
export function straightSpine(count: number, x: number, y: number, heading: number, length: number) {
  const nodes = new Float32Array(count * 2);
  const seg = length / (count - 1);
  for (let k = 0; k < count; k++) {
    nodes[k * 2] = x - Math.cos(heading) * seg * k;
    nodes[k * 2 + 1] = y - Math.sin(heading) * seg * k;
  }
  return nodes;
}

/**
 * Copies `src` into `out` with a travelling sideways wave whose amplitude grows toward the tail,
 * fills `arc` with cumulative lengths and returns the total length.
 */
export function waveSpine(src: Float32Array, out: Float32Array, arc: Float32Array, phase: number, amplitude: number, waves = 5) {
  const n = src.length / 2;
  for (let k = 0; k < n; k++) {
    const s = k / (n - 1);
    const a = Math.max(0, k - 1);
    const b = Math.min(n - 1, k + 1);
    let tx = src[a * 2] - src[b * 2];
    let ty = src[a * 2 + 1] - src[b * 2 + 1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const off = amplitude * (0.1 + 0.9 * s ** 1.8) * Math.sin(phase - s * waves);
    out[k * 2] = src[k * 2] - ty * off;
    out[k * 2 + 1] = src[k * 2 + 1] + tx * off;
  }
  arc[0] = 0;
  for (let k = 1; k < n; k++) arc[k] = arc[k - 1] + Math.hypot(out[k * 2] - out[(k - 1) * 2], out[k * 2 + 1] - out[(k - 1) * 2 + 1]);
  return arc[n - 1] || 1;
}

/** Result of `nearestOnSpine`: position along (s, 0 head → 1 tail), signed offset across (v), and the side's normal. */
export interface SpineHit {
  s: number;
  v: number;
  dist: number;
  nx: number;
  ny: number;
}

/** Nearest point on a spine polyline to (px, py), in body coordinates. */
export function nearestOnSpine(spine: Float32Array, arc: Float32Array, total: number, px: number, py: number, hit: SpineHit) {
  const n = spine.length / 2;
  let best = Infinity;
  for (let k = 0; k < n - 1; k++) {
    const ax = spine[k * 2];
    const ay = spine[k * 2 + 1];
    const sx = spine[(k + 1) * 2] - ax;
    const sy = spine[(k + 1) * 2 + 1] - ay;
    const len2 = sx * sx + sy * sy || 1;
    const u = Math.max(0, Math.min(1, ((px - ax) * sx + (py - ay) * sy) / len2));
    const qx = ax + sx * u;
    const qy = ay + sy * u;
    const d2 = (px - qx) ** 2 + (py - qy) ** 2;
    if (d2 < best) {
      best = d2;
      const len = Math.sqrt(len2);
      const side = sx * (py - ay) - sy * (px - ax) >= 0 ? 1 : -1;
      hit.s = (arc[k] + u * len) / total;
      hit.nx = (-sy / len) * side;
      hit.ny = (sx / len) * side;
      hit.v = side;
    }
  }
  hit.dist = Math.sqrt(best);
  hit.v *= hit.dist;
  return hit;
}

/* ------------------------------------------------------------------ cell buffer */

/** Sub-cell sample points (x, y pairs in cell units) for anti-aliased silhouettes. */
export const SUBSAMPLES = [0.25, 0.28, 0.75, 0.3, 0.27, 0.74, 0.74, 0.72];

/**
 * What to draw in each cell this frame: an optional solid block (an index into a list of fill
 * styles, 0 = none) and an optional glyph (atlas glyph and color, 255 = none) at an opacity level.
 */
export class CellBuffer {
  block: Uint16Array;
  glyph: Uint8Array;
  color: Uint8Array;
  alpha: Uint8Array;
  /** Which layer last wrote the cell; nearer things overwrite farther ones. */
  depth: Float32Array;
  private order: Int32Array;

  constructor(readonly size: number) {
    this.block = new Uint16Array(size);
    this.glyph = new Uint8Array(size);
    this.color = new Uint8Array(size);
    this.alpha = new Uint8Array(size);
    this.depth = new Float32Array(size);
    this.order = new Int32Array(size);
    this.clear();
  }

  clear() {
    this.block.fill(0);
    this.glyph.fill(255);
    this.alpha.fill(255);
    this.depth.fill(-1);
  }

  /** Writes a cell if `depth` is at least the cell's current depth. Alpha is 0–255. */
  set(i: number, depth: number, block: number, glyph: number, color: number, alpha = 255) {
    if (i < 0 || depth < this.depth[i]) return;
    this.depth[i] = depth;
    this.block[i] = block;
    this.glyph[i] = glyph;
    this.color[i] = color;
    this.alpha[i] = alpha;
  }

  /**
   * Draws blocks grouped by fill style (one fillStyle change per color), then glyphs from the
   * atlas (globalAlpha changes only when the level does). The context must be in CSS pixels.
   */
  draw(ctx: CanvasRenderingContext2D, g: CellGrid, styles: readonly string[], atlas: GlyphAtlas | null) {
    const { block, glyph, color, alpha, order, size } = this;
    const counts = new Int32Array(styles.length + 1);
    for (let i = 0; i < size; i++) if (block[i]) counts[block[i]]++;
    const starts = new Int32Array(styles.length + 1);
    for (let b = 1; b <= styles.length; b++) starts[b] = starts[b - 1] + counts[b - 1];
    const cursor = starts.slice();
    for (let i = 0; i < size; i++) if (block[i]) order[cursor[block[i]]++] = i;
    for (let b = 1; b < styles.length; b++) {
      if (!counts[b]) continue;
      ctx.fillStyle = styles[b];
      for (let k = starts[b]; k < starts[b] + counts[b]; k++) {
        const i = order[k];
        ctx.fillRect((i % g.cols) * g.cw + 0.5, ((i / g.cols) | 0) * g.ch + 0.5, g.cw - 1, g.ch - 1);
      }
    }
    if (!atlas) return;
    // Atlas sprites are square (as tall as a cell), so center them in the narrower cell.
    const ox = (g.cw - atlas.cell) / 2;
    const oy = (g.ch - atlas.cell) / 2;
    let current = 255;
    for (let i = 0; i < size; i++) {
      if (glyph[i] === 255) continue;
      if (alpha[i] !== current) {
        current = alpha[i];
        ctx.globalAlpha = current / 255;
      }
      atlas.draw(ctx, glyph[i], color[i], (i % g.cols) * g.cw + ox, ((i / g.cols) | 0) * g.ch + oy);
    }
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------------ colors */

/** Parses any CSS color a canvas understands into 0–255 RGB (browser only). */
export function parseColor(color: string): [number, number, number] {
  const c = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!c) return [0, 0, 0];
  c.fillStyle = "#000";
  c.fillStyle = color;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

export const mix3 = (a: readonly number[], b: readonly number[], t: number) => `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)} ${Math.round(a[1] + (b[1] - a[1]) * t)} ${Math.round(a[2] + (b[2] - a[2]) * t)})`;
