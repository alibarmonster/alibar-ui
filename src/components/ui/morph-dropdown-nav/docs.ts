import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MorphDropdownNav } from "@/components/ui/morph-dropdown-nav/morph-dropdown-nav";

<MorphDropdownNav brand={<Logo />} items={items} actions={actions} />`,
  a11y: [
    "Every trigger controls the same panel (`aria-controls`) and reports its own `aria-expanded`.",
    "Escape closes the panel and returns focus to the trigger; keyboard focus moves the panel too.",
    "Under reduced motion the panel and its content swap without sliding.",
  ],
  notes: [
    "The panel measures its content and springs to the new size and position as you move between menus; content slides in the direction you moved.",
    "Menus with four or more links use two columns.",
  ],
};
