import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PageFlipBook } from "@/components/ui/page-flip-book/page-flip-book";

<PageFlipBook items={pages} aspect={0.72} onSpreadChange={(spread) => console.log(spread)} />`,
  a11y: [
    "The book is a focusable, labelled group: ← → turn a page, Home and End jump to the cover and the end. The previous and next buttons do the same and are disabled at the ends.",
    "The visible pages are listed as text for screen readers, and a polite live region announces the new page numbers and titles after each turn.",
    "With reduced motion pages change instantly, with no curl.",
  ],
  notes: [
    "A turning leaf is a chain of CSS 3D strips: the first rotates around the spine and each next one bends a little more, peaking mid-turn, so the free edge trails like paper. Each strip shows its slice of the front and back page images and darkens as it turns away from the light.",
    "A gradient along the spine and a shadow cast by the turning leaf onto the page underneath give the depth. Drag from either half to turn by hand (release past halfway or flick to finish), or click a half to turn that way.",
    "The first page is the cover, alone on the right; every spread after shows two pages.",
  ],
};
