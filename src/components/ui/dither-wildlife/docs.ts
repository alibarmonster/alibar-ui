import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DitherWildlife } from "@/components/ui/dither-wildlife/dither-wildlife";

<DitherWildlife scene="horses" className="h-[480px]">
  <Hero />
</DitherWildlife>`,
  a11y: [
    "The scene is a decorative canvas (aria-hidden); content passed as children keeps its own semantics.",
    "Under reduced motion it draws one still frame (the flock already gathered). It pauses offscreen, in hidden tabs and while `paused`.",
    "Birds react to a mouse or pen hovering over the scene; nothing depends on it.",
  ],
  notes: [
    "Each frame is painted as soft grayscale shapes into a small buffer. In the default `ascii` look, every glyph cell (1.45 times as tall as wide, like a terminal) reads six sub-samples: covered cells get a block shaded smoothly along the `tones` under a glyph whose density follows the shade, ordered-dithered (4×4 Bayer) between its two nearest densities, and partly covered cells get an edge glyph (- \\\\ | /) that follows the silhouette.",
    "Ground and shadows are painted as texture, so they come out as sparse glyphs rather than blocks. Birds and falling leaves are glyph sprites (v, \\\\v/, ~v~). Galloping hooves kick up dust and the flock leaves faint trails in a small energy field that spreads and fades; the pointer stirs it too. Glyphs come from a shared sprite atlas.",
    "`look=\"dither\"` keeps the original pixel look: the buffer (one texel per `cell`) is ordered-dithered into the `tones` and scaled up without smoothing, so the pixels stay crisp.",
    "The ASCII look learns from ascii-sharks by drewdi (MIT), like ASCII Shark Sea and ASCII Koi Pond; the code is our own.",
    "Scenes: `horses` gallop past at different depths with a few distant birds; `birds` is a flock that wheels around a drifting point and scatters from the pointer; `grove` is a row of trees swaying in the wind (bending away from the pointer) with falling leaves.",
    "Pass your own `tones` (light to dark) and `background` to recolor it, for example sepia inks on cream paper.",
  ],
};
