import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DuoPanelMenu } from "@/components/ui/duo-panel-menu/duo-panel-menu";

<DuoPanelMenu brand={<Logo />} items={[{ label: "Product", items: links, featured: highlights, featuredLabel: "Capabilities" }]} actions={actions} />`,
  a11y: [
    "Each panel is a plain list of links, so it reads naturally with a screen reader.",
    "Triggers expose `aria-expanded`; Escape returns focus to the trigger.",
    "The dark column keeps text at a 4.5:1 contrast or better.",
  ],
  notes: [
    "`featured` fills the dark side of a panel; without it the panel is a single light list.",
    "The dark side slides in a beat after the panel opens.",
  ],
};
