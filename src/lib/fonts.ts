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
