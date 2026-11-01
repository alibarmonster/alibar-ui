import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MorphMenu } from "@/components/ui/morph-menu/morph-menu";

export function FileActions() {
  return (
    <MorphMenu
      label="Actions"
      items={[
        { label: "New file", onSelect: createFile },
        { label: "Delete", destructive: true, onSelect: deleteFile },
      ]}
    />
  );
}`,
  a11y: [
    "The trigger is a button with aria-haspopup=\"menu\"; Enter, Space, ArrowDown or ArrowUp opens it and focus moves to the first enabled item.",
    "The open surface is role=\"menu\" with menuitems and a roving tabindex. Arrow keys, Home and End move, Escape closes and returns focus to the button, and Tab closes.",
    "Clicking outside closes the menu; choosing an item runs onSelect, closes the menu and returns focus.",
    "Disabled items are announced with aria-disabled and skipped by the keyboard.",
    "With reduced motion enabled, the button and menu swap without morphing and items appear without sliding.",
  ],
  notes: [
    "The button and the menu share a Motion layoutId, so the button grows into the menu and shrinks back from it.",
    "Both surfaces use the same tone, so the color never jumps mid-morph.",
    "An invisible copy of the trigger reserves its space while the menu is open, so surrounding layout never shifts.",
  ],
};
