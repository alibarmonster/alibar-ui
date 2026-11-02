import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LivingBook } from "@/components/ui/living-book/living-book";

<LivingBook
  pages={[<Cover key="1" />, <Intro key="2" />, <ChapterOne key="3" />, <Plate key="4" />]}
  pageSize={{ width: 240, height: 320 }}
/>`,
  a11y: [
    "The book is a focusable group (aria-roledescription=\"book\"): ← and → turn pages, and Previous and Next buttons with a polite page counter do the same.",
    "Only the open spread is in the accessibility tree and interactive; its geometry is synced to the tilted pages, so text selection, links and the form on the last page work where they are drawn. Pages are inert while turning.",
    "With reduced motion, or without the HTML-in-Canvas API, it is a two-column paginated book (pages swing in with a CSS rotateY, or swap instantly under reduced motion).",
  ],
  notes: [
    "Experimental: uses the HTML-in-Canvas origin trial through src/lib/html-canvas/. Works in every browser via the fallback.",
    "The turning sheet is a 24-segment strip bent along a circular arc in the vertex shader, showing the front page and, past 90°, the next page mirrored. Each page has its own texture, uploaded only when that page repaints.",
    "Pages are drawn at `pageSize`; give each page content that fits it.",
  ],
};
