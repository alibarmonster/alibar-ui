import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DisintegrateDelete } from "@/components/ui/disintegrate-delete/disintegrate-delete";

<DisintegrateDelete
  items={[{ id: "brief", title: "Launch brief.pdf", subtitle: "2.4 MB" }]}
  onDelete={(item) => trash(item.id)}
  onRestore={(item) => restore(item.id)}
/>`,
  a11y: [
    "Rows are a labelled list of live DOM rows, each with a named Delete button. Their geometry follows the drawn rows while the gap closes, so the next row's button stays clickable.",
    "Deleting moves focus to the next row (or the previous one), and announces \"Deleted … Undo is available\". Undo restores the row in place, moves focus back to it and announces it.",
    "With reduced motion, or without the HTML-in-Canvas API, rows fade and collapse instead (a plain fade under reduced motion).",
  ],
  notes: [
    "Experimental: uses the HTML-in-Canvas origin trial through src/lib/html-canvas/. Works in every browser via the fallback.",
    "Each row is drawn from its own texture, re-uploaded only when that row repaints. Dust is one instanced draw of 3 px cells sampling the deleted row's last texture, which is kept until the Undo toast goes away.",
    "The canvas extends above the list so dust can drift upward; only the rows take pointer events.",
  ],
};
