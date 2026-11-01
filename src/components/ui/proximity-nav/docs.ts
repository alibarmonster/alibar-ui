import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import Link from "next/link";
import { ProximityNav } from "@/components/ui/proximity-nav/proximity-nav";

export function WorkIndex() {
  return (
    <ProximityNav
      linkComponent={Link}
      aria-label="Selected work"
      items={[
        { label: "Aurora Design System", href: "/work/aurora", meta: "2026" },
        { label: "Atlas Maps", href: "/work/atlas", meta: "2023" },
      ]}
    />
  );
}`,
  a11y: [
    "Plain links in a labelled <nav>; the current page has aria-current=\"page\".",
    "At rest, and for touch, every link is fully opaque. The dimming only happens while a mouse is over the list, so text contrast is never reduced otherwise.",
    "Keyboard focus brings the focused link to full size and brightness, as if the cursor were resting on it.",
    "With reduced motion enabled, links don't scale; the brightness falloff, which isn't movement, remains.",
  ],
  notes: [
    "Scale and opacity follow a smooth cosine falloff from the cursor out to radius, driven by springs, so the effect never snaps.",
    "Only transform and opacity animate; link centers are measured once (and on resize) because transforms don't affect layout.",
  ],
};
