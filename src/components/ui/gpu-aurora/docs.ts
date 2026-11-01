import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { GpuAurora } from "@/components/ui/gpu-aurora/gpu-aurora";

<GpuAurora className="min-h-96">
  <YourHero />
</GpuAurora>`,
  a11y: [
    "The canvas is decorative (aria-hidden); children render above it as normal content.",
    "With reduced motion the shader draws a single still frame. Without WebGL2, or on software rendering with no GPU, a CSS fallback in the same colors is shown.",
  ],
  notes: [
    "Three curtains follow sine and fBm paths. Each is crisp at its lower edge and fades upward, with gentle vertical streaks. It draws with alpha, so the page background shows through. This is a GPU take on Light Aurora, which stays a CSS-only component.",
    "Built on useShaderCanvas: it pauses offscreen and in hidden tabs, caps the pixel ratio at 1.5, recovers from context loss and releases the GPU on unmount.",
  ],
};
