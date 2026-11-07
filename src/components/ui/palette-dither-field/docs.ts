import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PaletteDitherField, type PaletteDitherFieldHandle } from "@/components/ui/palette-dither-field/palette-dither-field";

const field = useRef<PaletteDitherFieldHandle>(null);

<PaletteDitherField ref={field} palette="ember" pixelSize={4} className="h-[480px]">
  <Hero />
</PaletteDitherField>

// Later: crossfade without restarting the waves.
field.current?.setPalette(["#0b1026", "#2d3f8c", "#9db6ff"]);`,
  a11y: [
    "The field is a decorative canvas (aria-hidden) behind your content, which keeps its own semantics.",
    "Under reduced motion it draws one still frame, and palette changes switch instantly instead of crossfading. It pauses offscreen and in hidden tabs.",
    "The pointer ripple is an extra; nothing depends on it. Check the contrast of text you place on top against the lightest and darkest palette colors.",
  ],
  notes: [
    "A WebGL2 fragment shader sums 3–5 sine layers (each leaning a little off `direction`, with its own frequency, pace and a simplex wobble) plus fBm into a height field. The height is quantized to the palette's steps and ordered-dithered (8×8 Bayer) between the two nearest colors, one cell per `pixelSize` CSS pixels.",
    "Palettes are presets from `src/lib/glyph/palettes.ts` (midnight, peach, ember, moss, lilac, mono, accent) or 2–8 hex colors from dark to light. A crossfade is a dither too: more pixels take the new palette over about 400ms.",
    "Without WebGL2 (or on software renderers) the shader is skipped and a CSS gradient through the palette shows instead.",
  ],
};
