import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SpotlightCard } from "@/components/ui/spotlight-card/spotlight-card";

export function Feature() {
  return (
    <SpotlightCard className="rounded-2xl border border-border bg-card p-5">
      <h3>Fast by default</h3>
    </SpotlightCard>
  );
}`,
  a11y: [
    "Purely decorative layers (aria-hidden); content and semantics are untouched.",
    "The glow only follows a mouse. It's driven by the pointer and never moves on its own, so it stays on under reduced motion.",
  ],
  notes: [
    "The glow is a fixed-size radial circle moved with transforms; no gradient is repainted per frame.",
    "The border light is the same glow behind a mask that keeps only a 1px ring, so the edge lights up near the cursor.",
    "Use `color` and `borderColor` for dark cards (see the Dark example).",
  ],
};
