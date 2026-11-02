import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ClothBanner } from "@/components/ui/cloth-banner/cloth-banner";

<ClothBanner onDismiss={() => hideBanner()}>
  Version 0.3.0 is out. <a href="/changelog">Read the changelog</a>
</ClothBanner>`,
  a11y: [
    "The bar is a labelled region of real text, a real link and a close button named \"Dismiss announcement\"; they keep their tab order and focus rings.",
    "Hovering the link or the close button calms the cloth so they hold still under the pointer. The bar's geometry is synced to the flat cloth, which the calmed waves stay close to.",
    "With reduced motion the bar is completely still; without the HTML-in-Canvas API it sways with a subtle CSS skew.",
  ],
  notes: [
    "Experimental: uses the HTML-in-Canvas origin trial through src/lib/html-canvas/. Works in every browser via the fallback.",
    "The cloth is a 48 × 6 grid displaced in the vertex shader, so each frame costs one small draw; the bar texture updates only when the bar repaints. The loop pauses offscreen and in hidden tabs.",
    "The canvas extends 14 px above and below the bar for the folds; the root uses negative margins so the layout keeps the bar's own height.",
  ],
};
