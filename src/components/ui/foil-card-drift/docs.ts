import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FoilCardDrift } from "@/components/ui/foil-card-drift/foil-card-drift";

<FoilCardDrift
  cards={[
    { id: "1", label: "Obsidian card", design: "obsidian" },
    { id: "2", label: "Sky card", design: "sky", holder: "Serena Lo" },
    { id: "3", label: "Chrome card", design: "chrome" },
  ]}
/>`,
  a11y: [
    "The strip is a labelled list and every card has an accessible name; the card faces are decorative.",
    "The drift is continuous motion, so a visible pause button (aria-pressed) stops it, and hovering slows it nearly to a stop.",
    "Under reduced motion the cards stand still and the pause button is hidden; dragging still scrubs them.",
  ],
  notes: [
    "Every card is driven by one shared Motion value, so the loop never re-renders React. Cards turn, recede and fade as they move off center.",
    "The foil is a rainbow gradient masked by an emblem, and its position follows each card's turn. Your own `children` faces get the same sheen and chip.",
    "Cards keep the ID-1 ratio (85.6 × 54 mm). Fictional designs only: never put real card numbers or network marks on them.",
  ],
};
