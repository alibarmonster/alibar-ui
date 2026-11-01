import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ActionBar } from "@/components/ui/action-bar/action-bar";

export function RowActions() {
  return (
    <ActionBar
      aria-label="File actions"
      items={[
        { id: "edit", label: "Edit", icon: <PencilIcon />, onClick: edit },
        { id: "delete", label: "Delete", icon: <TrashIcon />, destructive: true, onClick: remove },
      ]}
    />
  );
}`,
  a11y: [
    "A toolbar with one tab stop; arrow keys, Home and End move between actions and skip disabled ones.",
    "Every action keeps its label as the accessible name (aria-label), whether or not the label is showing.",
    "Keyboard focus expands the focused action and takes priority over hover.",
    "With reduced motion enabled, actions resize instantly and labels fade in place.",
  ],
  notes: [
    "Buttons and the bar resize with Motion layout animations (transforms with distortion correction), never width.",
    "Use the dark tone for floating selection bars over content.",
  ],
};
