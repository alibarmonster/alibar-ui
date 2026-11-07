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
    "Seen from above, each koi is a follow-the-leader spine of 16 segments with a body profile (head, shoulders, tapering body) and a travelling wave that grows toward the tail. Cells are about 1.45 times as tall as they are wide, like a terminal.",
    "Every covered cell gets a shaded block lit from the top left and a glyph whose density follows the shade: sparse . : on lit scales, dense % # @ in shadow. Five sub-samples per cell decide coverage, so partly covered edge cells get a light glyph instead of a hard block. Fins and the tail are translucent blocks with fin rays (- \\\\ | /).",
    "Patterns (pale scales, orange and red patches, dark markings) come from value noise in each fish's own body coordinates, so they travel with the fish. Four varieties are mixed in.",
    "Wakes and food ripples go into a diffusing energy field that lights small dots in the water and fades. Lily pads drift past as notched outlines. Pass `palette` as an object to recolor any part; it starts from `base`.",
    "The rendering approach (top-down bodies, shaded blocks with density-matched glyphs, sub-sampled edges, a wake field) learns from ascii-sharks by drewdi (MIT); this is an independent implementation.",
  ],
};
