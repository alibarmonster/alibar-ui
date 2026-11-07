/**
 * Image sampling for glyph art: an image is downsampled so each glyph cell gets one pixel, and
 * each cell's luminance and alpha are read back. Browser only.
 */

/** One value per glyph cell, row by row. */
export interface GlyphSample {
  cols: number;
  rows: number;
  /** Perceived brightness per cell, 0 (black) to 1 (white). */
  luminance: Float32Array;
  /** Opacity per cell, 0 (transparent, or outside the image under `contain`) to 1. */
  alpha: Float32Array;
}

/** How the image maps onto the grid: crop to fill it, fit inside it, or stretch. */
export type SampleFit = "cover" | "contain" | "fill";

const MAX_CACHED = 48;
const images = new Map<string, Promise<HTMLImageElement>>();
const samples = new Map<string, Promise<GlyphSample>>();

/** Loads an image once per `src` and resolves when it can be drawn. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  let pending = images.get(src);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      // Same-origin images are unaffected; cross-origin ones must send CORS headers to be readable.
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image: ${src}`));
      image.src = src;
    });
    pending.catch(() => images.delete(src));
    images.set(src, pending);
  }
  return pending;
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas is unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

/**
 * Samples an already loaded source (image, canvas, video frame) into a `cols × rows` grid.
 * Large sources are halved step by step first, so every cell averages its whole area.
 */
export function sampleSource(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  cols: number,
  rows: number,
  fit: SampleFit = "cover",
): GlyphSample {
  const width = Math.max(1, Math.round(cols));
  const height = Math.max(1, Math.round(rows));
  const sourceAspect = sourceWidth / Math.max(1, sourceHeight);
  const gridAspect = width / height;

  // Source crop (cover) and destination rect (contain) in grid cells.
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  let dx = 0;
  let dy = 0;
  let dw = width;
  let dh = height;
  if (fit === "cover") {
    if (sourceAspect > gridAspect) {
      sw = sourceHeight * gridAspect;
      sx = (sourceWidth - sw) / 2;
    } else {
      sh = sourceWidth / gridAspect;
      sy = (sourceHeight - sh) / 2;
    }
  } else if (fit === "contain") {
    if (sourceAspect > gridAspect) {
      dh = Math.max(1, Math.round(width / sourceAspect));
      dy = Math.floor((height - dh) / 2);
    } else {
      dw = Math.max(1, Math.round(height * sourceAspect));
      dx = Math.floor((width - dw) / 2);
    }
  }

  let current: CanvasImageSource = source;
  while (sw > dw * 2 && sh > dh * 2) {
    const nw = Math.max(dw, Math.ceil(sw / 2));
    const nh = Math.max(dh, Math.ceil(sh / 2));
    const step = makeCanvas(nw, nh);
    step.ctx.drawImage(current, sx, sy, sw, sh, 0, 0, nw, nh);
    current = step.canvas;
    sx = 0;
    sy = 0;
    sw = nw;
    sh = nh;
  }

  const out = makeCanvas(width, height);
  out.ctx.drawImage(current, sx, sy, sw, sh, dx, dy, dw, dh);
  const { data } = out.ctx.getImageData(0, 0, width, height);
  const luminance = new Float32Array(width * height);
  const alpha = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    luminance[i] = (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) / 255;
    alpha[i] = data[o + 3] / 255;
  }
  return { cols: width, rows: height, luminance, alpha };
}

/**
 * Loads `src` and samples it into a `cols × rows` grid (one pixel per glyph cell). Results are
 * cached per source and grid size, so cards that share an image and cell size sample it once.
 */
export function sampleImage(src: string, cols: number, rows: number, fit: SampleFit = "cover"): Promise<GlyphSample> {
  const key = `${src}|${Math.round(cols)}x${Math.round(rows)}|${fit}`;
  const cached = samples.get(key);
  if (cached) {
    // Refresh its place in the LRU order.
    samples.delete(key);
    samples.set(key, cached);
    return cached;
  }
  const pending = loadImage(src).then((image) => sampleSource(image, image.naturalWidth, image.naturalHeight, cols, rows, fit));
  pending.catch(() => samples.delete(key));
  samples.set(key, pending);
  while (samples.size > MAX_CACHED) samples.delete(samples.keys().next().value as string);
  return pending;
}
