import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TiltCard } from "@/components/ui/tilt-card/tilt-card";

export function CreditCard() {
  return (
    <TiltCard className="aspect-[1.586] w-80 rounded-2xl bg-zinc-900 p-6 text-white">
      {/* translateZ lifts a child toward the viewer as the card tilts */}
      <div className="[transform:translateZ(36px)]">…</div>
    </TiltCard>
  );
}`,
  a11y: [
    "Purely decorative: the card's content and semantics are untouched, and the glare layer is aria-hidden.",
    "Tilt follows a mouse only; touch and pen input never tilt, so scrolling a page of cards stays smooth.",
    "With reduced motion enabled, the card doesn't tilt, scale or show glare.",
  ],
  notes: [
    "Uses transformPerspective on the card itself, so no wrapper element is needed. Children with translateZ get real depth thanks to preserve-3d.",
    "Pointer math uses the bounding box's center (which doesn't move while tilting) and offset sizes (which ignore transforms), so the tilt never wobbles.",
    "The glare is a radial highlight on a layer twice the card's size, moved with transforms and blended with soft-light. It shows best on dark or saturated cards.",
  ],
};
