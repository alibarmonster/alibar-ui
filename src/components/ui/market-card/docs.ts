import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MarketCard, tradeLayoutId } from "@/components/ui/market-card/market-card";

<MarketCard
  market={market}
  watched={watched}
  onWatchChange={setWatched}
  onTrade={(market, outcomeId, side) => openTicket({ market, outcomeId, side })}
/>

// Give the ticket the same layout id and the pressed button morphs into it:
<TradeTicket market={market} layoutId={tradeLayoutId(market.id, outcomeId, side)} />`,
  a11y: [
    "Yes and No are labelled buttons that show their price, so the choice never depends on color. Changes read as \"▲ 4%\" with an arrow, not just green or red.",
    "The watch star is a toggle with aria-pressed and a clear label. The payout preview appears on hover and on keyboard focus.",
    "Countdowns render after hydration (useNow), so server and client never disagree about the time left.",
    "With reduced motion the bars, gauge, stamp and button lift appear without animation; prices change color without rolling.",
  ],
  notes: [
    "Prices are integer basis points (6400 = 64% = 64¢) and money is integer cents; binary markets always keep Yes + No = 100¢. Helpers live in lib/markets (math, format, types) and ship with the component.",
    "The card is presentational: pass a market and handle onTrade. Demos use lib/markets/mock (fictional markets plus a tick engine) and show a Simulated badge; never wire this to real money without your own compliance review.",
    "States: open, closing soon (amber pulse), resolved (an outcome stamp replaces the buttons) and a loading skeleton via loading.",
  ],
};
