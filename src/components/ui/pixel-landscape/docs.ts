import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PixelLandscape } from "@/components/ui/pixel-landscape/pixel-landscape";

<PixelLandscape className="h-[480px]" palette="ember">
  <Hero />
</PixelLandscape>`,
  a11y: [
    "The landscape is a decorative canvas (aria-hidden); content passed as children keeps its own semantics.",
    "The sun follows a mouse or pen only, never touch. Under reduced motion it draws one still frame; it pauses offscreen and in hidden tabs.",
  ],
  notes: [
    "The crests come from ridged multi-octave noise (two ranges, the taller one wins), so every `seed` gives a different range. Slopes are banded into shadow, mid and lit by their angle to the sun plus gully streaks, with a few accent flecks.",
    "The range is painted once to an offscreen canvas and only repainted when the light moves or the size changes; each frame just copies it and draws the dithered cloud.",
    "Palettes: ember (the default), alpine and dusk, or pass your own colors. `shape` switches between round dots and square pixels.",
  ],
};
