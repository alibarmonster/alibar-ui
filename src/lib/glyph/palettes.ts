import { hexToRgb, type Vec3 } from "@/lib/color";

/**
 * Named palettes for glyph and dither pieces. Each is 2–8 hex colors ordered from dark to light,
 * so a value of 0 maps to the first color and 1 to the last.
 */
export const GLYPH_PALETTES = {
  midnight: ["#070b1f", "#141d45", "#24347a", "#3d57b8", "#7896ec", "#dfe7ff"],
  peach: ["#3b1611", "#83362a", "#cf6448", "#f19774", "#ffc9a9", "#fff3ea"],
  ember: ["#12070a", "#45100e", "#9a240f", "#e2531a", "#ffa03a", "#ffe28c"],
  moss: ["#0d1a12", "#1e3a26", "#3a6a3e", "#6c994d", "#b6ca7c", "#f0f3d8"],
  lilac: ["#1b1430", "#3d2b6b", "#6b54ae", "#a38de0", "#d6caf6", "#f7f3ff"],
  mono: ["#09090b", "#3f3f46", "#a1a1aa", "#fafafa"],
  /** Built around the library accent (`--primary`, #2563eb). */
  accent: ["#081536", "#11307f", "#2563eb", "#7aa3f8", "#dce8ff"],
} as const satisfies Record<string, readonly string[]>;

export type GlyphPaletteName = keyof typeof GLYPH_PALETTES;

/** A palette preset name, or 2–8 hex colors ordered dark to light. */
export type GlyphPaletteInput = GlyphPaletteName | readonly string[];

/** Display names for the presets, in the order demos list them. */
export const GLYPH_PALETTE_LABELS: Record<GlyphPaletteName, string> = {
  midnight: "Midnight",
  peach: "Peach",
  ember: "Ember",
  moss: "Moss",
  lilac: "Lilac",
  mono: "Mono",
  accent: "Accent",
};

export const MIN_PALETTE_COLORS = 2;
export const MAX_PALETTE_COLORS = 8;

const HEX = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;

export const isGlyphPaletteName = (value: unknown): value is GlyphPaletteName => typeof value === "string" && value in GLYPH_PALETTES;

/**
 * Resolves a preset name or a color list to 2–8 hex colors. Invalid entries are dropped and the
 * list is cut to 8; fewer than 2 valid colors fall back to `mono`.
 */
export function resolvePalette(input: GlyphPaletteInput | undefined, fallback: GlyphPaletteName = "mono"): string[] {
  if (input === undefined) return [...GLYPH_PALETTES[fallback]];
  if (typeof input === "string") return [...(isGlyphPaletteName(input) ? GLYPH_PALETTES[input] : GLYPH_PALETTES[fallback])];
  const colors = input.map((c) => c.trim()).filter((c) => HEX.test(c)).slice(0, MAX_PALETTE_COLORS);
  return colors.length >= MIN_PALETTE_COLORS ? colors : [...GLYPH_PALETTES[fallback]];
}

/** A palette's colors as 0–255 RGB triples. */
export function paletteRgb(palette: readonly string[]): Vec3[] {
  return palette.map((c) => hexToRgb(c));
}

/** Linear blend of two RGB triples. */
export function mixRgb(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** The color at `t` (0 = first, 1 = last) along a palette, blending between neighbors. */
export function samplePalette(rgb: readonly Vec3[], t: number): Vec3 {
  if (rgb.length === 0) return [0, 0, 0];
  if (rgb.length === 1) return rgb[0];
  const x = Math.min(1, Math.max(0, t)) * (rgb.length - 1);
  const i = Math.min(rgb.length - 2, Math.floor(x));
  return mixRgb(rgb[i], rgb[i + 1], x - i);
}

/** An RGB triple as a CSS color. */
export const rgbCss = ([r, g, b]: Vec3, alpha = 1) =>
  alpha >= 1 ? `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})` : `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${alpha})`;

/** A CSS gradient through every palette color, for static fallbacks. */
export function paletteGradient(palette: readonly string[], direction = "to top") {
  return `linear-gradient(${direction}, ${palette.join(", ")})`;
}
