import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BorderBeam } from "@/components/ui/border-beam/border-beam";

<BorderBeam className="p-6" radius={16}>
  <YourCardContent />
</BorderBeam>`,
  a11y: [
    "The beam is a decorative SVG (aria-hidden); the card content is untouched.",
    "With reduced motion the beam doesn't travel, and the change applies live if the setting flips.",
  ],
  notes: [
    "Two dashed strokes (a soft tail and a bright head) on a rounded rect with pathLength 1, animated with the Web Animations API. The beam moves at constant speed around any card size with no per-frame JavaScript.",
    "Set radius to your card's corner radius. Stack two beams with a delay of half the duration to send them round half a lap apart.",
  ],
};
