/**
 * Glyph ramps: characters ordered from sparse (light, index 0) to dense (dark, last index).
 * Index 0 is usually a space, so the brightest areas of an image stay empty.
 */
export const GLYPH_RAMPS = {
  /** The classic ASCII ramp. */
  classic: " .:-=+*#%@",
  /** Binary digits only: empty, then 1, then 0 for the darkest areas. */
  binary: " 10",
  /** Shade blocks. */
  blocks: " ░▒▓█",
  /** Dots that grow. */
  dots: " ·•●",
} as const;

export type GlyphRampName = keyof typeof GLYPH_RAMPS;

/** A built-in ramp name or your own string of glyphs, sparse to dense. */
export type GlyphRamp = GlyphRampName | (string & {});

/** The glyphs of a ramp as an array (handles characters outside the BMP). Unknown names are used as literal glyphs. */
export function rampGlyphs(ramp: GlyphRamp): string[] {
  const source = ramp in GLYPH_RAMPS ? GLYPH_RAMPS[ramp as GlyphRampName] : ramp;
  const glyphs = Array.from(source);
  return glyphs.length ? glyphs : Array.from(GLYPH_RAMPS.classic);
}

/**
 * Index of the glyph for a luminance (0 = black, 1 = white) in a ramp of `count` glyphs.
 * Dark values pick dense glyphs (high indices), bright values sparse ones.
 */
export function glyphIndex(luminance: number, count: number): number {
  const darkness = 1 - Math.min(1, Math.max(0, luminance));
  return Math.min(count - 1, Math.floor(darkness * count));
}

/** The glyph for a luminance (0 = black, 1 = white): dense glyphs for dark areas, sparse ones for bright areas. */
export function pickGlyph(luminance: number, ramp: GlyphRamp = "classic"): string {
  const glyphs = rampGlyphs(ramp);
  return glyphs[glyphIndex(luminance, glyphs.length)];
}
