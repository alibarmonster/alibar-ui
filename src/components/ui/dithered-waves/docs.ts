import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DitheredWaves } from "@/components/ui/dithered-waves/dithered-waves";

<DitheredWaves className="h-80" pixelSize={3} />`,
  a11y: [
    "The canvas is decorative (aria-hidden); children render above it as normal content.",
    "With reduced motion the shader draws a single still frame. Without WebGL2, a CSS fallback in the same colors is shown.",
  ],
  notes: [
    "Waves are sampled once per dither cell and compared with an 8×8 Bayer threshold, so tones become ordered dot patterns. The canvas renders one pixel per CSS pixel with pixelated scaling, which keeps the grid crisp.",
    "Built on useShaderCanvas: it pauses offscreen and in hidden tabs, caps the pixel ratio at 1.5, recovers from context loss and releases the GPU on unmount.",
  ],
};
