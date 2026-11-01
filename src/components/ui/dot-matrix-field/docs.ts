import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DotMatrixField } from "@/components/ui/dot-matrix-field/dot-matrix-field";

<DotMatrixField className="h-80" spacing={14} />`,
  a11y: [
    "The canvas is decorative (aria-hidden); children render above it as normal content.",
    "With reduced motion the shader draws a single still frame. Without WebGL2, or on software rendering with no GPU, a CSS fallback in the same colors is shown.",
  ],
  notes: [
    "Each dot samples a drifting fBm field at its cell center, which sets its radius and opacity. Near the cursor, dots get an extra boost. The background is transparent, so the field sits on any surface.",
    "Built on useShaderCanvas: it pauses offscreen and in hidden tabs, caps the pixel ratio at 1.5, recovers from context loss and releases the GPU on unmount.",
  ],
};
