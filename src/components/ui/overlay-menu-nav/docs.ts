import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { OverlayMenuNav } from "@/components/ui/overlay-menu-nav/overlay-menu-nav";

<OverlayMenuNav brand={<Logo />} groups={groups} features={[{ title: "Designing cards", href: "/blog/cards", image: "/cards.jpg", tag: "Product" }]} />`,
  a11y: [
    "The Menu button reports `aria-expanded` and controls the overlay, a labelled `<nav>`.",
    "Escape closes it and returns focus to the button.",
    "Card images take `alt`; leave it empty when the title already describes the story.",
  ],
  notes: [
    "The overlay blurs the page beneath it (`backdrop-filter`), so whatever is behind shows through softly.",
    "Columns rise one after another and card images unveil from the bottom; reduced motion keeps simple fades.",
    "It covers the screen (`h-dvh`) by default; `overlayClassName` sizes it inside a panel.",
  ],
};
