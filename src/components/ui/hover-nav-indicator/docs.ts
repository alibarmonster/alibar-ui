import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import Link from "next/link";
import { usePathname } from "next/navigation";
import { HoverNavIndicator } from "@/components/ui/hover-nav-indicator/hover-nav-indicator";

export function SiteNav() {
  const pathname = usePathname();
  return (
    <HoverNavIndicator
      linkComponent={Link}
      activeHref={pathname}
      items={[
        { label: "Product", href: "/product" },
        { label: "Pricing", href: "/pricing" },
      ]}
    />
  );
}`,
  a11y: [
    "Real links inside a labelled <nav>; the current page has aria-current=\"page\".",
    "The indicator follows keyboard focus as well as hover, so Tab users see the same glide.",
    "The indicator is decorative (aria-hidden); the current page is also shown with a stronger text color.",
    "With reduced motion enabled, the indicator jumps instead of gliding.",
  ],
  notes: [
    "The indicator rests on activeHref, glides to whatever is hovered or focused, and glides back when the pointer leaves.",
    "Pass linkComponent (e.g. Next.js Link) for client-side routing; every link gets href, className, aria-current and the event handlers.",
  ],
};
