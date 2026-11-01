import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LightRays } from "@/components/ui/light-rays/light-rays";

<LightRays className="min-h-96" color="#F59E0B">
  <YourHero />
</LightRays>`,
  a11y: [
    "The canvas is decorative (aria-hidden); children render above it as normal content.",
    "With reduced motion the shader draws a single still frame. Without WebGL2, or on software rendering with no GPU, a CSS fallback in the same colors is shown.",
  ],
  notes: [
    "Rays come from angle bands around a light source above the top edge, mixing two frequencies with noise for irregular widths. The source sways slowly, and rays fade with distance and toward the bottom.",
    "Built on useShaderCanvas: it pauses offscreen and in hidden tabs, caps the pixel ratio at 1.5, recovers from context loss and releases the GPU on unmount.",
  ],
};
