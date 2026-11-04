import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { NotchNav } from "@/components/ui/notch-nav/notch-nav";

<NotchNav logo={<Leaf />} left={[{ label: "Gardens", href: "/gardens" }]} right={[{ label: "Saved", href: "/saved" }]} />`,
  a11y: [
    "The current link carries `aria-current=\"page\"`; the dot is decorative.",
    "The center circle is a real link with an accessible name (`logoLabel`).",
    "Below the container's 2xl width the side links move into a menu button.",
  ],
  notes: [
    "The bar is two rounded halves and an SVG notch drawn as one silhouette, so the drop shadow follows the curve.",
    "Pass `active` to control the current page from your router, or leave it out and the component tracks clicks.",
    "`accent` colors the circle and the dot; `surface` colors the bar.",
  ],
};
