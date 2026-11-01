import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { UserCheck, UserPlus } from "lucide-react";
import { ActionSwapButton } from "@/components/ui/action-swap-button/action-swap-button";

export function FollowButton() {
  return (
    <ActionSwapButton
      label="Follow"
      pressedLabel="Following"
      icon={<UserPlus />}
      pressedIcon={<UserCheck />}
      onPressedChange={(following) => setFollowing(following)}
    />
  );
}`,
  a11y: [
    "The label itself changes, so the button does not also set aria-pressed (per the WAI-ARIA button pattern).",
    "After each toggle, a polite status region announces the new label.",
    "In iconOnly mode, `label` and `pressedLabel` become the accessible name. Pass strings there.",
    "Both states are measured in one grid cell, so the button keeps a steady width and never shifts its neighbors.",
    "With reduced motion enabled, the content cross-fades without sliding or blurring.",
  ],
  notes: [
    "Each look (solid, outline and so on) is a separate layer that cross-fades, so the color change stays on opacity.",
  ],
};
