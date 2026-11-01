import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { GrainGradient } from "@/components/ui/grain-gradient/grain-gradient";

<GrainGradient className="min-h-96" grain={0.15}>
  <YourContent />
</GrainGradient>`,
  a11y: [
    "The canvas is decorative (aria-hidden); children render above it as normal content.",
    "With reduced motion the shader draws a single still frame. Without WebGL2, a CSS fallback in the same colors is shown.",
  ],
  notes: [
    "Grain is a per-pixel hash re-seeded 24 times a second, layered over a noise-warped three-color gradient. It renders at full resolution (capped at a 1.5 pixel ratio) so the grain stays fine.",
    "Built on useShaderCanvas: it pauses offscreen and in hidden tabs, caps the pixel ratio at 1.5, recovers from context loss and releases the GPU on unmount.",
  ],
};
