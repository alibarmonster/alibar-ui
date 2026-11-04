import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SplitIslands } from "@/components/ui/split-islands/split-islands";

<SplitIslands brand={<LogoMark />} items={menus} links={[{ label: "Pricing", href: "/pricing" }]} secondary={login} cta={signup} />`,
  a11y: [
    "Two islands share one `<nav>` landmark, so screen readers hear one navigation.",
    "Menu triggers expose `aria-expanded`; Escape and outside clicks close them.",
    "Give an icon-only brand an `aria-label`.",
  ],
  notes: [
    "The left island holds the logo mark and the menus, the right one plain links and actions.",
    "Dropdowns blur in as they open; reduced motion keeps a plain fade.",
  ],
};
