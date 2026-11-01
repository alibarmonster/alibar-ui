import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FlipCard } from "@/components/ui/flip-card/flip-card";

export function Pass() {
  return <FlipCard className="w-80" front={<PassFront />} back={<PassBack />} />;
}`,
  a11y: [
    "The whole card is a toggle button (aria-pressed); the hidden face is aria-hidden so only the visible side is read.",
    "Keep faces free of links and buttons. If a face needs them, control `flipped` from your own button instead.",
    "With reduced motion enabled, the faces crossfade instead of turning over.",
  ],
  notes: [
    "A spring flip with a slight dip in scale halfway, so the card feels lifted and turned over. Flip side to side (axis=\"y\") or top over bottom (axis=\"x\").",
    "Both faces share one grid cell, so the card sizes to the larger face; no fixed height needed.",
  ],
};
