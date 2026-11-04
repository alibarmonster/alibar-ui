import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { IslandNav } from "@/components/ui/island-nav/island-nav";

<IslandNav brand={<Logo />} items={items} cta={{ label: "Get started", href: "/signup" }} />`,
  a11y: [
    "A labelled `<nav>` inside a sticky `<header>`; every entry is a real link.",
    "Below the container's md width the links move into a menu button with `aria-expanded`; Escape closes it and returns focus.",
    "The scroll tightening is skipped under reduced motion.",
  ],
  notes: [
    "Pass `scrollContainer` when the navbar lives in a scrolling panel instead of the page.",
    "Entries with `items` link to their first child here; use a navbar with dropdowns if you need menus.",
    "Breakpoints are container queries, so it adapts to its own width, not the viewport's.",
  ],
};
