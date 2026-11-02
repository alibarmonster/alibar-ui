import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PixelMosaic } from "@/components/ui/pixel-mosaic/pixel-mosaic";

<PixelMosaic className="h-72" colors={["#1f2940", "#3e5bd8", "#f2c230", "#e5432a"]} edge="bottom" />`,
  a11y: [
    "The mosaic is a decorative canvas (aria-hidden); content passed as children keeps its own semantics.",
    "The pointer warmth follows a mouse or pen only. Under reduced motion the mosaic draws one still frame; it pauses offscreen and in hidden tabs.",
  ],
  notes: [
    "Colors are bands of a slow, diagonal noise field, from the first color (coolest) to the last (hottest); the middle of the band runs warmer. Any number of colors works.",
    "`edge` picks which side breaks into ragged columns and scattered pixels, and `fill` how much of the height stays solid before it does.",
    "Each frame is one fillRect per cell; at the default 12 px cell a full-width band is a few thousand cells.",
  ],
};
