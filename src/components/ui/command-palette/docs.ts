import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CommandPalette } from "@/components/ui/command-palette/command-palette";

export function AppCommands() {
  const router = useRouter();
  return (
    <CommandPalette
      items={[
        { id: "home", group: "Navigation", label: "Go home", onSelect: () => router.push("/") },
        { id: "new", group: "Actions", label: "New project", shortcut: ["⌘", "N"], onSelect: createProject },
      ]}
    />
  );
}`,
  a11y: [
    "Built on Radix Dialog: focus is trapped, Escape closes, scroll is locked and focus returns to whatever opened it.",
    "The search field is a combobox that controls the listbox through aria-activedescendant, so screen readers announce the active command as you arrow through.",
    "Groups are labelled; disabled commands are announced as unavailable and skipped by the arrow keys.",
    "Shortcut hints are decorative (aria-hidden); the palette doesn't bind them, so wire real shortcuts separately.",
    "With reduced motion enabled, the palette fades without scaling and the active row jumps instead of springing.",
  ],
  notes: [
    "Ranking favours exact and prefix matches, then word starts, substrings and loose in-order matches, then description, group and keyword hits.",
    "The hotkey toggles with ⌘ on Mac and Ctrl elsewhere. Pick a letter your app and the browser don't already use, or pass false.",
  ],
};
