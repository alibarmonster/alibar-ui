"use client";

import { useEffect, useState } from "react";
import { MarketActivity } from "@/components/ui/market-activity/market-activity";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { getMockMarket, mockComments, mockTrade, mockTrades, type MockTrade } from "@/lib/markets/mock";

const market = getMockMarket("glass-phone");

function useLiveTrades(interval: number) {
  const [trades, setTrades] = useState<MockTrade[]>(() => mockTrades(market, 8));
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTrades((t) => [{ ...mockTrade(market), at: Date.now() }, ...t].slice(0, 20)), interval);
    return () => window.clearInterval(id);
  }, [interval]);
  return trades;
}

export function LiveActivity() {
  const trades = useLiveTrades(2200);
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-3">
      <SimulatedBadge />
      <MarketActivity trades={trades} comments={mockComments} maxItems={7} />
    </div>
  );
}

export function Discussion() {
  const trades = useLiveTrades(4000);
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-3">
      <SimulatedBadge />
      <MarketActivity trades={trades} comments={mockComments} defaultTab="comments" />
    </div>
  );
}
