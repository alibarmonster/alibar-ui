import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { OutcomeLadder } from "@/components/ui/outcome-ladder/outcome-ladder";

<OutcomeLadder
  market={market} // type: "multi", outcomes with price in basis points
  onTrade={(outcomeId, side) => openTicket(outcomeId, side)}
/>`,
  a11y: [
    "The ladder is a list in rank order; each row's expand button reports aria-expanded and the Yes/No buttons are labelled with the side, price and outcome (\"Yes 42¢ on Northwind FC\").",
    "Rank changes move rows with a layout animation and briefly tint the row that climbed; the new rank number is also in the text.",
    "Price changes use rolling digits with ▲/▼ arrows, so direction never depends on color.",
    "With reduced motion rows jump to their new place and the tint is skipped.",
  ],
  notes: [
    "Rows sort by price on every render, so a live feed is all it takes to re-order them.",
    "Expanding a row shows a sparkline of the last 30 points and the outcome's volume, using the grid-rows trick for height.",
  ],
};
