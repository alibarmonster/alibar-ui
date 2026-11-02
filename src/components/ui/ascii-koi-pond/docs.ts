import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AsciiKoiPond } from "@/components/ui/ascii-koi-pond/ascii-koi-pond";

<AsciiKoiPond koi={5} palette="light" className="h-[480px]">
  <Hero />
</AsciiKoiPond>`,
  a11y: [
    "The pond is a decorative canvas (aria-hidden) behind your content, which keeps its own semantics and tab order. The fed counter is decorative too; use onFeed to announce it if it matters.",
    "Clicks on links, buttons and form fields belong to them, never become food. Following and scattering react to a mouse or pen only, so touch scrolling is untouched.",
    "Under reduced motion the pond draws a single still frame and clicks don't drop food. It pauses offscreen and in hidden tabs.",
  ],
  notes: [
    "Each koi is a follow-the-leader spine of 16 segments with a body profile (head, shoulders, tapering body, fanned tail) and a lateral sway that grows toward the tail. Cells inside the body become filled squares with a glyph: pale scales with dots, orange and red patches with X S % 8, dark markings with #.",
    "Patterns come from value noise in each fish's own body coordinates, so markings and glyphs travel with the fish instead of shimmering across the grid. Four varieties are mixed in.",
    "Wakes, ripples and lily pads are drawn with slope glyphs (- \\\\ | /). Pass `palette` as an object to recolor any part; it starts from `base`.",
  ],
};
