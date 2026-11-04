import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CenterPillNav } from "@/components/ui/center-pill-nav/center-pill-nav";

<CenterPillNav brand={<Logo />} items={items} actions={[{ label: "Log in", href: "/login" }, { label: "Sign up", href: "/signup" }]} accent="#ff5b14" />`,
  a11y: [
    "The highlight follows both hover and keyboard focus.",
    "Dropdown triggers expose `aria-expanded` and `aria-controls`; Escape closes and returns focus.",
    "Highlight and panel motion are instant under reduced motion.",
  ],
  notes: [
    "The last action becomes the accent button; the rest stay quiet.",
    "The three-column grid keeps the link pill centered whatever the brand and actions widths.",
  ],
};
