import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RadialMenu } from "@/components/ui/radial-menu/radial-menu";

export function CreateButton() {
  return (
    <RadialMenu
      label="Create"
      items={[
        { id: "note", label: "Note", icon: <NoteIcon />, onSelect: newNote },
        { id: "photo", label: "Photo", icon: <PhotoIcon />, onSelect: newPhoto },
      ]}
    />
  );
}`,
  a11y: [
    "The trigger is a button with aria-haspopup=\"menu\" and aria-expanded; opening moves focus to the first item.",
    "Items are menuitems with a roving tabindex: arrow keys go round the circle, Home and End jump, Escape closes and returns focus, and Tab closes.",
    "Every item has an accessible name, and its visible label appears on hover and keyboard focus.",
    "Clicking outside closes the menu.",
    "With reduced motion enabled, items fade in at their final positions, with no fan-out, rotation or halo growth.",
  ],
  notes: [
    "Items spread evenly from startAngle to endAngle (0° right, 90° down, 180° left, 270° up). A full 360° span spaces them evenly around the circle.",
    "Items fan out on a lightly underdamped spring with a 35ms stagger, and fold back in reverse order.",
    "Leave room of about radius + 40px around the button for the items and their labels.",
  ],
};
