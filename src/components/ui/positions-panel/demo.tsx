"use client";

import { useState } from "react";
import { PositionsPanel, type MarketPosition } from "@/components/ui/positions-panel/positions-panel";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { getMockMarket, mockPositions, useMockMarketFeed } from "@/lib/markets/mock";

const ids = [...new Set(mockPositions.map((p) => p.marketId))];
const markets = ids.map((id) => getMockMarket(id));
// A deterministic portfolio curve, cents.
const valueHistory = Array.from({ length: 30 }, (_, i) => 52000 + Math.round(Math.sin(i / 3) * 2600 + i * 310));

export function Portfolio() {
  const live = useMockMarketFeed(markets);
  const [note, setNote] = useState("");
  const positions: MarketPosition[] = mockPositions.map((p, i) => ({ id: `${p.marketId}-${i}`, market: live[ids.indexOf(p.marketId)], outcomeId: p.outcomeId, shares: p.shares, averagePrice: p.averagePrice, status: p.status, realized: p.realized }));
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <SimulatedBadge />
      <PositionsPanel positions={positions} cash={12850} valueHistory={valueHistory} onSell={(p) => setNote(`Sell ticket opened for ${p.market.question}`)} onClaim={(p) => setNote(`Claimed winnings on ${p.market.question}`)} />
      <p aria-live="polite" className="h-5 text-center text-[12px] text-muted-foreground">
        {note}
      </p>
    </div>
  );
}

export function Empty() {
  const [note, setNote] = useState("");
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <SimulatedBadge />
      <PositionsPanel positions={[]} cash={25000} onExplore={() => setNote("Opening the market feed…")} />
      <p aria-live="polite" className="h-5 text-[12px] text-muted-foreground">
        {note}
      </p>
    </div>
  );
}
