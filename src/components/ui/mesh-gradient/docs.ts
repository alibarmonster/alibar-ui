import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MeshGradient } from "@/components/ui/mesh-gradient/mesh-gradient";

<MeshGradient className="min-h-96" colors={["#C7D2FE", "#FBCFE8", "#BAE6FD", "#FDE68A"]}>
  <YourContent />
</MeshGradient>`,
  a11y: [
    "The canvas is decorative (aria-hidden); children render above it as normal content.",
    "With reduced motion the shader draws a single still frame. Without WebGL2, a CSS fallback in the same colors is shown.",
  ],
  notes: [
    "Four control points drift on slow orbits; each pixel blends their colors by inverse distance, lightly warped by simplex noise. Renders at half resolution, since soft gradients don't need more.",
    "Built on useShaderCanvas: it pauses offscreen and in hidden tabs, caps the pixel ratio at 1.5, recovers from context loss and releases the GPU on unmount.",
  ],
};
