import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SlideToConfirm } from "@/components/ui/slide-to-confirm/slide-to-confirm";

export function PayNow() {
  return <SlideToConfirm label="Slide to pay $49" confirmedLabel="Payment sent" onConfirm={() => pay()} />;
}`,
  a11y: [
    "The handle is a real button: Tab reaches it and Enter or Space confirms, so nobody has to drag.",
    "The handle is described by a hint that explains both the drag and the keyboard shortcut.",
    "A polite status region announces the confirmed label; afterwards the handle is aria-disabled.",
    "Tapping the handle without dragging does nothing, which prevents accidental confirms on touch screens.",
    "With reduced motion enabled, the handle snaps instead of springing and the idle nudge is removed.",
  ],
  notes: [
    "The fill is revealed with clip-path driven by the handle's position, so dragging stays on the compositor.",
    "The track measures itself with a ResizeObserver, so it works at any width. Set the width with className.",
  ],
};
