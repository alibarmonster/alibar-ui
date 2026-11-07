import localFont from "next/font/local";

/**
 * Geist Mono, set up like `geist/font/mono` but without a preload: it only styles code,
 * shortcuts and figures, so it shouldn't compete with the sans face and scripts on first load.
 */
export const geistMono = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Roboto Mono", "Menlo", "Monaco", "Liberation Mono", "DejaVu Sans Mono", "Courier New", "monospace"],
});

/**
 * Geist Serif for display headings in demos and components that ask for a serif face
 * (`var(--font-geist-serif)` with a system serif fallback). Not preloaded: only a few pages use it.
 */
export const geistSerif = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-serif/GeistSerif-Regular.woff2",
  variable: "--font-geist-serif",
  weight: "400",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-serif", "Iowan Old Style", "Georgia", "Times New Roman", "serif"],
});

/**
 * Geist Pixel (square cut) for pixel-style labels, e.g. the Retro Desktop Hero
 * (`var(--font-geist-pixel)` with a monospace fallback). Not preloaded.
 */
export const geistPixel = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-pixel/GeistPixel-Square.woff2",
  variable: "--font-geist-pixel",
  weight: "400",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});
