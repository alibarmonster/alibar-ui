import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BottomSheet } from "@/components/ui/bottom-sheet/bottom-sheet";

export function ShareSheet() {
  return (
    <BottomSheet trigger={<button>Share</button>} title="Share" snapPoints={[0.4, 0.9]}>
      <ShareTargets />
    </BottomSheet>
  );
}`,
  a11y: [
    "Built on Radix Dialog: focus is trapped, Escape closes, page scroll is locked and focus returns to the trigger.",
    "The handle is a real button (\"Expand sheet\" or \"Collapse sheet\") that steps through the snap points, so resizing never requires a drag.",
    "Dragging starts only from the handle and header, so scrolling the content never fights the gesture.",
    "With reduced motion enabled, the sheet snaps between positions instantly.",
  ],
  notes: [
    "On release, the sheet projects the flick velocity and settles on the nearest snap point, or closes if pulled well below the lowest one.",
    "The backdrop fades with the sheet's position, so dragging down visibly loosens the modal.",
    "The sheet is centered with a 32rem max width on larger screens.",
  ],
};
