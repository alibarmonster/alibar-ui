/**
 * Glyph sprite atlases: every glyph of a ramp is rendered once per color into one canvas, and
 * cells are blitted from it with `drawImage`. Drawing text per cell per frame (`fillText`) is far
 * slower, so glyph canvases never do it. Browser only.
 */

export interface GlyphAtlasOptions {
  /** Glyphs to pre-render, e.g. `rampGlyphs("classic")`. Spaces are kept as empty sprites. */
  glyphs: readonly string[];
  /** One tint per color, as any color a canvas accepts. Resolve CSS variables first with `resolveCanvasColors`. */
  colors: readonly string[];
  /** Size of one square cell in CSS pixels. */
  cell: number;
  /** Device pixel ratio to render for, capped at 2. @default 1 */
  dpr?: number;
  /** Font stack. @default Geist Mono (`--font-geist-mono`), then system monospace */
  fontFamily?: string;
  /** Font weight. @default 500 */
  fontWeight?: number | string;
  /** Glyph size as a share of the cell. @default 0.8 */
  fontScale?: number;
  /** Largest scale a sprite will be drawn at, so enlarged glyphs stay sharp. @default 1 */
  maxScale?: number;
}

export interface GlyphAtlas {
  readonly canvas: HTMLCanvasElement;
  readonly glyphs: readonly string[];
  readonly colors: readonly string[];
  /** Cell size in CSS pixels. */
  readonly cell: number;
  /** Index of a glyph in the atlas, or -1. */
  index(glyph: string): number;
  /**
   * Blits a glyph in a color with its cell's top-left corner at (x, y), in the context's current
   * units (CSS pixels when the context is scaled by the device pixel ratio). `scale` grows it
   * around the cell center. Set `globalAlpha` on the context for faded glyphs.
   */
  draw(ctx: CanvasRenderingContext2D, glyph: number, color: number, x: number, y: number, scale?: number): void;
}

const FALLBACK_MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", monospace';
const SHADES: Record<string, number> = { "░": 0.25, "▒": 0.5, "▓": 0.75, "█": 1 };
const GUTTER = 1;
const MAX_CACHED = 16;
const cache = new Map<string, GlyphAtlas>();

/** Geist Mono as set up by the site (`--font-geist-mono`), followed by system monospace fonts. */
export function monoFontFamily(element: Element = document.documentElement): string {
  const geist = getComputedStyle(element).getPropertyValue("--font-geist-mono").trim();
  return geist ? `${geist}, ${FALLBACK_MONO}` : FALLBACK_MONO;
}

/**
 * Turns CSS colors a canvas can't parse (`var(--primary)`, `color-mix(…)`, `currentColor`) into
 * computed `rgb()` strings by styling a hidden probe inside `element`. Plain colors pass through.
 */
export function resolveCanvasColors(colors: readonly string[], element: Element): string[] {
  let probe: HTMLSpanElement | null = null;
  const out = colors.map((color) => {
    if (!/var\(|color-mix\(|currentcolor/i.test(color)) return color;
    if (!probe) {
      probe = document.createElement("span");
      probe.style.display = "none";
      element.appendChild(probe);
    }
    probe.style.color = "";
    probe.style.color = color;
    return getComputedStyle(probe).color || color;
  });
  (probe as HTMLSpanElement | null)?.remove();
  return out;
}

const fontSpec = (options: GlyphAtlasOptions, size: number) =>
  `${options.fontWeight ?? 500} ${size}px ${options.fontFamily ?? FALLBACK_MONO}`;

/** Resolves once the atlas font is loaded (or failed to load), so atlases built after it use the real face. */
export async function loadGlyphFont(options: Pick<GlyphAtlasOptions, "glyphs" | "fontFamily" | "fontWeight">): Promise<void> {
  try {
    await document.fonts?.load(fontSpec({ ...options, colors: [], cell: 16 }, 16), options.glyphs.join("").replace(/\s/g, "") || "0");
  } catch {
    // A missing font falls back to the system monospace face.
  }
}

function createAtlas(options: GlyphAtlasOptions): GlyphAtlas {
  const { glyphs, colors, cell } = options;
  const dpr = Math.min(2, Math.max(1, options.dpr ?? 1));
  const sprite = Math.max(2, Math.ceil(cell * dpr * Math.max(1, options.maxScale ?? 1)));
  const stride = sprite + GUTTER * 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, glyphs.length * stride);
  canvas.height = Math.max(1, colors.length * stride);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = fontSpec(options, Math.round(sprite * (options.fontScale ?? 0.8)));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    colors.forEach((color, row) => {
      ctx.fillStyle = color;
      glyphs.forEach((glyph, col) => {
        const x = col * stride + GUTTER;
        const y = row * stride + GUTTER;
        const shade = SHADES[glyph];
        if (shade === 1) ctx.fillRect(x, y, sprite, sprite);
        else if (shade) {
          // Shade blocks as crisp dot screens rather than whatever the font draws.
          const dots = 4;
          const size = sprite / dots;
          for (let dy = 0; dy < dots; dy++) {
            for (let dx = 0; dx < dots; dx++) {
              const on = shade === 0.5 ? (dx + dy) % 2 === 0 : shade === 0.25 ? dx % 2 === 0 && dy % 2 === 0 : !(dx % 2 === 1 && dy % 2 === 1);
              if (on) ctx.fillRect(x + dx * size, y + dy * size, Math.ceil(size), Math.ceil(size));
            }
          }
        } else if (glyph.trim()) ctx.fillText(glyph, x + sprite / 2, y + sprite / 2 + sprite * 0.04);
      });
    });
  }
  const lookup = new Map(glyphs.map((g, i) => [g, i]));
  return {
    canvas,
    glyphs,
    colors,
    cell,
    index: (glyph) => lookup.get(glyph) ?? -1,
    draw(target, glyph, color, x, y, scale = 1) {
      if (glyph < 0 || color < 0 || glyph >= glyphs.length || color >= colors.length) return;
      const size = cell * scale;
      const offset = (size - cell) / 2;
      target.drawImage(canvas, glyph * stride + GUTTER, color * stride + GUTTER, sprite, sprite, x - offset, y - offset, size, size);
    },
  };
}

/**
 * Returns a glyph atlas for these options, building it on first use. Atlases are shared between
 * components with identical options. Once the font has loaded, the next call builds a fresh atlas
 * with the real face instead of reusing one drawn with the fallback.
 */
export function getGlyphAtlas(options: GlyphAtlasOptions): GlyphAtlas {
  const dpr = Math.min(2, Math.max(1, options.dpr ?? 1));
  const fontReady = typeof document === "undefined" || !document.fonts ? true : document.fonts.check(fontSpec(options, 16));
  const key = [options.glyphs.join(""), options.colors.join("|"), options.cell, dpr, options.fontFamily, options.fontWeight, options.fontScale, options.maxScale, fontReady].join("§");
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const atlas = createAtlas({ ...options, dpr });
  cache.set(key, atlas);
  while (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value as string);
  return atlas;
}
