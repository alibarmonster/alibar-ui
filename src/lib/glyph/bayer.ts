/**
 * Ordered (Bayer) dithering on the CPU. Shaders use the GLSL version, `GLSL_BAYER` in
 * `@/lib/webgl/noise.glsl`, which orders the thresholds the same way.
 */

export type BayerSize = 2 | 4 | 8;

/** Builds an n×n Bayer index matrix (values 0 to n²−1), row by row. */
function bayerIndices(size: number): number[] {
  if (size === 1) return [0];
  const half = size / 2;
  const inner = bayerIndices(half);
  const out = new Array<number>(size * size);
  const offsets = [0, 2, 3, 1];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const quadrant = (y >= half ? 2 : 0) + (x >= half ? 1 : 0);
      out[y * size + x] = 4 * inner[(y % half) * half + (x % half)] + offsets[quadrant];
    }
  }
  return out;
}

/** Thresholds in (0, 1), row by row, centered in each step so 0 and 1 are never hit exactly. */
const thresholds = (size: number) => Float32Array.from(bayerIndices(size), (v) => (v + 0.5) / (size * size));

/** 2×2 Bayer thresholds in (0, 1), row by row. */
export const BAYER_2 = thresholds(2);
/** 4×4 Bayer thresholds in (0, 1), row by row. */
export const BAYER_4 = thresholds(4);
/** 8×8 Bayer thresholds in (0, 1), row by row. */
export const BAYER_8 = thresholds(8);

const MATRICES: Record<BayerSize, Float32Array> = { 2: BAYER_2, 4: BAYER_4, 8: BAYER_8 };

/** The Bayer threshold (0–1) for a pixel. Coordinates wrap, and negative ones are fine. */
export function bayerThreshold(x: number, y: number, size: BayerSize = 4): number {
  const mask = size - 1;
  return MATRICES[size][((y | 0) & mask) * size + ((x | 0) & mask)];
}

/**
 * Ordered-dithers a value in [0, 1] to one of `levels` steps (0 to levels − 1). Between two
 * steps, the pixel's Bayer threshold decides whether it rounds up, so flat areas become an
 * even pattern of the two nearest steps instead of a hard band.
 */
export function orderedDither(value: number, x: number, y: number, levels: number, size: BayerSize = 4): number {
  const top = Math.max(1, Math.round(levels) - 1);
  const scaled = Math.min(1, Math.max(0, value)) * top;
  const base = Math.floor(scaled);
  if (base >= top) return top;
  return scaled - base > bayerThreshold(x, y, size) ? base + 1 : base;
}
