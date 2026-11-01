import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ExpandableCard } from "@/components/ui/expandable-card/expandable-card";

export function Project() {
  return (
    <ExpandableCard
      title="Aurora Design System"
      description="Tokens, components and docs for 40 teams."
      media={<img src="/aurora.jpg" alt="" className="size-full object-cover" />}
    >
      <p>The full case study…</p>
    </ExpandableCard>
  );
}`,
  a11y: [
    "The card is a button that opens a real dialog (Radix): focus moves inside, Escape and the close button dismiss it, and focus returns to the card.",
    "The title is the dialog's accessible name and the description its description.",
    "With reduced motion enabled, the card opens and closes without morphing.",
  ],
  notes: [
    "The card, media, title and description share layout ids with the dialog, so each piece morphs into place, and back on close.",
    "Media is shown at 16:9 in both states, so it scales uniformly instead of stretching mid-morph.",
    "While open, an invisible copy holds the card's space, so the surrounding grid never reflows.",
  ],
};
