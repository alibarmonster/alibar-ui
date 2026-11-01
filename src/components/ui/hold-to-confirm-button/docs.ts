import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Trash2 } from "lucide-react";
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button/hold-to-confirm-button";

export function DeleteProject() {
  return (
    <HoldToConfirmButton icon={<Trash2 />} confirmedLabel="Deleted" onConfirm={() => deleteProject()}>
      Hold to delete
    </HoldToConfirmButton>
  );
}`,
  a11y: [
    "Holding Space or Enter works the same as holding the pointer; key repeat is ignored.",
    "The button is described by a visually hidden hint, e.g. \"Press and hold for 1.5 seconds to confirm.\"",
    "Releasing early, moving the pointer off the button, or moving focus away cancels the hold and retracts the fill.",
    "A polite status region announces the confirmed label.",
    "With reduced motion enabled, the fill still shows progress (it is the core feedback), but the press scale and label slide are removed.",
  ],
  notes: [
    "The fill is a second copy of the label revealed with clip-path, so the text changes color exactly at the fill edge.",
    "A cancelled hold resumes from its current progress if the user presses again before it retracts.",
  ],
};
