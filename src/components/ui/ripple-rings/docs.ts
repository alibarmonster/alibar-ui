import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RippleRings } from "@/components/ui/ripple-rings/ripple-rings";

<RippleRings>
  <Avatar />
</RippleRings>`,
  a11y: [
    "The rings are decorative; describe what's happening (\"Calling Maya…\") in text next to it.",
    "With reduced motion the rings don't travel: they rest at evenly spaced sizes, fading outward.",
  ],
  notes: [
    "Pure CSS keyframes (transform and opacity) with staggered delays, so rings leave at a steady rhythm. The keyframes ship inside the component.",
    "Rings scale with whatever size the center is, so the effect works for small badges and large avatars alike.",
  ],
};
