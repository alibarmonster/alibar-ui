import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ShimmeringDots } from "@/components/ui/shimmering-dots/shimmering-dots";

export function Panel() {
  return (
    <ShimmeringDots className="h-72">
      <h2>Quietly alive</h2>
    </ShimmeringDots>
  );
}`,
  a11y: [
    "The canvas is decorative and aria-hidden.",
    "Twinkles are brief and spread out rather than strobing. With reduced motion enabled, the grid is static.",
  ],
  notes: [
    "Each twinkling dot follows its own sharpened sine wave, so dots spend most of their time dim and flash briefly at different moments.",
    "Drawn on a canvas and paused while offscreen; the grid fades out toward the edges unless fade={false}.",
  ],
};
