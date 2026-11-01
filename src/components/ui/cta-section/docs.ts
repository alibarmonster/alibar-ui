import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CtaSection } from "@/components/ui/cta-section/cta-section";

<CtaSection
  title="Ship interfaces that feel alive"
  description="Copy one in and see the difference in minutes."
  primaryAction={{ label: "Get started", href: "/docs" }}
  secondaryAction={{ label: "See pricing", href: "/pricing" }}
/>`,
  a11y: [
    "The headline is an h2 and the actions are real links or buttons with visible labels; the beam and glow are aria-hidden.",
    "With reduced motion the beam doesn't travel. It stays as a still highlight on the border, and the change applies live if the setting flips.",
  ],
  notes: [
    "The beam is two dashed SVG strokes (a soft tail and a bright head) on a rounded rect with pathLength 1, animated with the Web Animations API. It moves at constant speed around any card size with no per-frame JavaScript.",
    "Match radius to your card's corner radius so the beam follows the border exactly.",
  ],
};
