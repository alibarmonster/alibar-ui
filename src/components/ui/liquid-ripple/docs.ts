import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LiquidRipple } from "@/components/ui/liquid-ripple/liquid-ripple";

<LiquidRipple className="h-80">
  <YourContent />
</LiquidRipple>`,
  a11y: [
    "Ripples are decorative. Children stay fully interactive, and clicking anywhere also creates a ripple.",
    "With reduced motion the shader draws a single still frame. Without WebGL2, or on software rendering with no GPU, a CSS fallback in the same colors is shown.",
  ],
  notes: [
    "Up to eight ripples live in a ring buffer the shader reads every frame (position, start time, strength). Pointer moves add small ripples at most every 140ms, clicks add a strong one, and each wave front travels outward while it decays.",
    "Built on useShaderCanvas: it pauses offscreen and in hidden tabs, caps the pixel ratio at 1.5, recovers from context loss and releases the GPU on unmount.",
  ],
};
