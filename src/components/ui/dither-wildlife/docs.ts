import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DitherWildlife } from "@/components/ui/dither-wildlife/dither-wildlife";

<DitherWildlife scene="horses" className="h-[480px]">
  <Hero />
</DitherWildlife>`,
  a11y: [
    "The scene is a decorative canvas (aria-hidden); content passed as children keeps its own semantics.",
    "Under reduced motion it draws one still frame. It pauses offscreen and in hidden tabs.",
    "Birds react to a mouse or pen hovering over the scene; nothing depends on it.",
  ],
  notes: [
    "Each frame is drawn as soft grayscale shapes into a small buffer (one texel per `cell`), then ordered-dithered (4×4 Bayer) into the `tones` and scaled up without smoothing, so the pixels stay crisp.",
    "Scenes: `horses` gallop past at different depths with a few distant birds; `birds` is a flock that wheels around a drifting point and scatters from the pointer; `grove` is a row of trees swaying in the wind (bending away from the pointer) with falling leaves.",
    "Pass your own `tones` (light to dark) and `background` to recolor it, for example sepia inks on cream paper.",
  ],
};
