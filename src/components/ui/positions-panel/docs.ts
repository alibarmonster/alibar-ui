import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PositionsPanel } from "@/components/ui/positions-panel/positions-panel";

<PositionsPanel
  positions={[{ id: "p1", market, outcomeId: "yes", shares: 15600, averagePrice: 5100, status: "open" }]}
  cash={12850} // cents
  onSell={(position) => openSellTicket(position)}
  onClaim={(position) => claim(position)}
/>`,
  a11y: [
    "Open, Resolved and History are tabs with arrow-key support. Each position row names the market, outcome, shares, average price, value and P&L in text.",
    "Profit and loss show a sign and an arrow as well as color. Lost positions are dimmed and labelled \"Lost\".",
    "Claim announces the claimed amount politely; the coin burst is decorative and skipped with reduced motion.",
  ],
  notes: [
    "Shares are hundredths and pay $1 each, so a won position's payout in cents equals its share count. Average price and current price are basis points.",
    "Open positions are valued at the live price, so the total rolls whenever the market moves; claiming adds the payout to the total.",
    "With no positions an empty state with an Explore markets action is shown.",
  ],
};
