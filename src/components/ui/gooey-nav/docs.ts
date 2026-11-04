import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { GooeyNav } from "@/components/ui/gooey-nav/gooey-nav";

<GooeyNav brand="S." items={items} cta={{ label: "Download app", href: "/download" }} />`,
  a11y: [
    "The blob layer is a hidden copy of the row (`aria-hidden`, not focusable), so screen readers and the keyboard only meet the real links once.",
    "Hover and focus both move the outline pill; necks only stretch for a mouse.",
    "Neck and pill motion is instant under reduced motion.",
  ],
  notes: [
    "The liquid necks come from an SVG goo filter (blur plus an alpha threshold) on the blob layer only, so text stays crisp.",
    "Use `tone=\"light\"` for light capsules on dark pages.",
    "Narrow containers keep the badge and swap the rest for a menu capsule.",
  ],
};
