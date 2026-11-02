import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PeelCard } from "@/components/ui/peel-card/peel-card";

<PeelCard
  front={<Coupon />}
  back={<CouponCode />}
  onRevealChange={(revealed) => revealed && track("coupon_revealed")}
/>`,
  a11y: [
    "Both faces are live DOM; only the visible one is interactive and in the accessibility tree (the other is inert and aria-hidden).",
    "The corner is a button named \"Peel to reveal the back\" or \"Cover the back again\" with aria-expanded, so the card works from the keyboard: press it instead of dragging.",
    "With reduced motion, or without the HTML-in-Canvas API, the corner button flips the card in CSS 3D (instantly under reduced motion).",
  ],
  notes: [
    "Experimental: uses the HTML-in-Canvas origin trial through src/lib/html-canvas/. Works in every browser via the fallback.",
    "The curl is a 28 × 28 grid wrapped around a cylinder in the vertex shader, with the paper's underside on the flap and a soft shadow along the fold on the face below.",
    "Released past halfway along the diagonal, the front peels off; otherwise it springs back to its lifted corner.",
  ],
};
