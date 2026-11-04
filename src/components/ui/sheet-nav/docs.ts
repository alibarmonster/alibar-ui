import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SheetNav } from "@/components/ui/sheet-nav/sheet-nav";

<SheetNav brand={<Logo />} items={items} aside={contact} actions={actions} cta={{ label: "Book a demo", href: "/demo" }} />`,
  a11y: [
    "The Menu button reports `aria-expanded` and controls the sheet, a labelled `<nav>`.",
    "Escape closes the sheet and returns focus to the button; groups expand with `aria-expanded` and stay inert while closed.",
    "Under reduced motion the sheet fades instead of growing out of the corner.",
  ],
  notes: [
    "The sheet grows out of the button with a clip-path circle; links rise in one after another.",
    "It covers the screen (`h-dvh`) by default; pass `sheetClassName` to size it inside a panel.",
    "Works the same at every width, which makes it a good fit for portfolio and studio sites.",
  ],
};
