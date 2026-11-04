import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ScrollAwareNav } from "@/components/ui/scroll-aware-nav/scroll-aware-nav";

<ScrollAwareNav brand={<Logo />} items={items} actions={actions} />`,
  a11y: [
    "It never hides while a menu is open, and shows again on any upward scroll.",
    "The progress line is decorative (`aria-hidden`).",
    "Motion is instant under reduced motion.",
  ],
  notes: [
    "See-through until `solidAfter` px, then frosted with a hairline and a shorter height.",
    "`hideOnScroll={false}` keeps it pinned; `progress={false}` drops the line.",
    "Pass `scrollContainer` when it lives in a scrolling panel.",
  ],
};
