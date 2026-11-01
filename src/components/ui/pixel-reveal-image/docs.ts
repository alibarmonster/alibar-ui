import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PixelRevealImage } from "@/components/ui/pixel-reveal-image/pixel-reveal-image";

<PixelRevealImage src="/images/cover.jpg" alt="Product screenshot" trigger="inView" />`,
  a11y: [
    "The real <img> with its alt text stays in the DOM, so assistive tech reads the image normally; the canvas on top is aria-hidden.",
    "With reduced motion the shader draws a single still frame (the image shows sharp right away). Without WebGL2, a CSS fallback in the same colors is shown.",
  ],
  notes: [
    "The image is uploaded once as a WebGL texture and sampled at the center of each cell; the cell size eases from cellSize down to one pixel. The underlying <img> stays in place for accessibility and as the fallback.",
    "Built on useShaderCanvas: it pauses offscreen and in hidden tabs, caps the pixel ratio at 1.5, recovers from context loss and releases the GPU on unmount.",
  ],
};
