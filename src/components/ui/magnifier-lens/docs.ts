import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MagnifierLens } from "@/components/ui/magnifier-lens/magnifier-lens";

<MagnifierLens zoom={2} size={140}>
  <PricingTable />
</MagnifierLens>`,
  a11y: [
    "The lens is purely visual: the content keeps its own semantics, tab order and links, and stays clickable under the lens.",
    "On touch the lens appears while a finger is down and follows it; the page still scrolls vertically.",
    "With reduced motion, or without the HTML-in-Canvas API, a scaled clone of the content (inert and hidden from assistive tech) is shown in a clip-path circle instead.",
  ],
  notes: [
    "Experimental: uses the HTML-in-Canvas origin trial through src/lib/html-canvas/. Works in every browser via the fallback.",
    "The content texture is uploaded only when the content repaints; moving the lens only redraws, and the frame loop runs only while the lens grows in or out.",
    "`distortion` bends the magnified view toward the rim like a real loupe; 0 gives a flat zoom.",
  ],
};
