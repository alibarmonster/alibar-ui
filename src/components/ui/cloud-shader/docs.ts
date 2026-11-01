import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CloudShader } from "@/components/ui/cloud-shader/cloud-shader";

<CloudShader className="min-h-[520px]" density={4} interactive>
  <YourHero />
</CloudShader>`,
  a11y: [
    "The sky is a decorative canvas (aria-hidden); children render above it as normal content.",
    "With reduced motion the shader draws one still frame. Without WebGL2, or on software rendering with no GPU, a CSS gradient in the same colors is shown.",
    "Check text contrast against your sky colors: the default palette is light, so use dark text on it.",
  ],
  notes: [
    "Two parallax layers, each a broad, lightly domain-warped shape field plus fBm detail (3, 5 or 6 octaves for low, medium or high quality), with soft lighting on the undersides. Renders at 0.6× resolution by default, capped at a 1.5 pixel ratio.",
    "Pauses when scrolled offscreen or when the tab is hidden, and releases its WebGL context on unmount.",
    "fadeToBackground fades the bottom edge to transparent, so the sky blends into whatever page background sits behind it.",
  ],
};
