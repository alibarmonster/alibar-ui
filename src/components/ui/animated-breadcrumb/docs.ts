import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import Link from "next/link";
import { AnimatedBreadcrumb } from "@/components/ui/animated-breadcrumb/animated-breadcrumb";

export function PageTrail() {
  return (
    <AnimatedBreadcrumb
      linkComponent={Link}
      items={[
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: "Aurora" },
      ]}
    />
  );
}`,
  a11y: [
    "A labelled <nav> with an ordered list, and the current page marked with aria-current=\"page\".",
    "Separators are aria-hidden, so screen readers read only the trail.",
    "Collapsed levels sit behind a menu button labelled with how many it hides (\"Show 3 more\"); the menu is a Radix DropdownMenu with full keyboard support.",
    "With reduced motion enabled, items fade in and out without sliding.",
  ],
  notes: [
    "New levels slide in from the left with a blur, and the others glide to make room through a Motion layout animation.",
    "Above maxItems, the trail keeps the root and the last maxItems − 2 levels, and the rest move into the menu.",
  ],
};
