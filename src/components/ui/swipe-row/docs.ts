import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Archive, Trash2 } from "lucide-react";
import { SwipeRow } from "@/components/ui/swipe-row/swipe-row";

<SwipeRow
  leftActions={[{ id: "archive", label: "Archive", icon: <Archive />, tone: "success", onAction: archive }]}
  rightActions={[{ id: "delete", label: "Delete", icon: <Trash2 />, tone: "destructive", onAction: remove }]}
>
  <MessagePreview />
</SwipeRow>`,
  a11y: [
    "Actions are real buttons in the tab order: tabbing to one slides the row open to show it, and Escape or moving focus away closes it.",
    "Pressing outside the row also closes it. With reduced motion enabled, the row snaps open and closed.",
  ],
  notes: [
    "Swipe partway and release to keep the actions open; swipe past `fullSwipe` (60% of the row) to run the outermost action straight away.",
    "Actions are listed outermost first. The outermost action's color fills the extra space on a long swipe, and icons grow in as they're uncovered.",
    "Removing the row is up to you in onAction. The demo collapses it with the grid-rows trick inside AnimatePresence.",
  ],
};
