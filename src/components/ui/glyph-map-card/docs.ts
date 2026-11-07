import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { GlyphMapCard } from "@/components/ui/glyph-map-card/glyph-map-card";

<GlyphMapCard
  image="/images/reef-fish.webp"
  imageAlt="A striped reef fish"
  title="Reef Drifter"
  description="A striped reef fish, sampled into glyphs."
  location="Tidepool Studio, Bay 3"
  watchers={{ people: [{ name: "Maya Lindqvist", image: "/avatars/maya.webp" }], total: 31 }}
  tone="indigo"
  ramp="classic"
/>`,
  a11y: [
    "The glyph map is a canvas inside an element with role=\"img\" and the `imageAlt` label; the title, description, buttons and watcher names are real DOM text.",
    "Add card is a toggle button with aria-pressed. Expand opens a modal dialog labelled by the title; Escape or the Close button closes it and focus returns to Expand.",
    "Under reduced motion the map is drawn once with the true glyphs: no re-rolling, no scramble under the pointer, and the expand morph is instant. The map pauses offscreen and in hidden tabs.",
  ],
  notes: [
    "The image is downsampled to one pixel per cell (`src/lib/glyph/sample-image.ts`, cached per image and grid size) and each cell picks a glyph by darkness: dense glyphs for dark areas, empty cells for the pale ground. Glyphs are blitted from a shared sprite atlas in Geist Mono, never drawn with fillText per cell.",
    "Images must be same-origin or served with CORS headers, since the canvas reads their pixels. Bold silhouettes on a pale background read best.",
    "The title uses `--font-geist-serif` when it is defined (Geist Serif, from the `geist` package) and falls back to the system serif.",
    "`ramp` picks classic ASCII (` .:-=+*#%@`), binary (`1` and `0`) or shade blocks (`░▒▓█`, drawn as crisp dot screens). Smaller `cell` values draw more, smaller glyphs.",
  ],
};
