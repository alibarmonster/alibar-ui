"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { MarketCard, tradeLayoutId, type TradeChoice } from "@/components/ui/market-card/market-card";
import { TradeTicket } from "@/components/ui/trade-ticket/trade-ticket";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { getMockMarket, useMockMarketFeed } from "@/lib/markets/mock";

const picks = [getMockMarket("glass-phone"), getMockMarket("fusion-demo")];

export function Binary() {
  const live = useMockMarketFeed(picks);
  const [watched, setWatched] = useState<Record<string, boolean>>({ "glass-phone": true });
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <SimulatedBadge />
      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        <MarketCard market={live[0]} watched={watched[live[0].id]} onWatchChange={(w) => setWatched((s) => ({ ...s, [live[0].id]: w }))} />
        <MarketCard market={live[1]} variant="compact" watched={watched[live[1].id]} onWatchChange={(w) => setWatched((s) => ({ ...s, [live[1].id]: w }))} />
      </div>
    </div>
  );
}

export function States() {
  const live = useMockMarketFeed([getMockMarket("harbor-cup"), getMockMarket("monsoon-early"), getMockMarket("album-week")]);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <SimulatedBadge />
      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        <MarketCard market={live[0]} />
        <MarketCard market={live[1]} />
        <MarketCard market={live[2]} />
        <MarketCard market={live[0]} loading />
      </div>
    </div>
  );
}

export function CardToTicket() {
  const market = useMockMarketFeed([getMockMarket("glass-phone")])[0];
  const [trade, setTrade] = useState<{ outcomeId: string; side: TradeChoice } | null>(null);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <SimulatedBadge />
      <LayoutGroup>
        <div className="grid w-full max-w-sm place-items-center">
          <AnimatePresence initial={false} mode="popLayout">
            {trade ? (
              <TradeTicket key="ticket" market={market} outcomeId={trade.outcomeId} choice={trade.side} layoutId={tradeLayoutId(market.id, trade.outcomeId, trade.side)} onClose={() => setTrade(null)} />
            ) : (
              <MarketCard key="card" market={market} onTrade={(_, outcomeId, side) => setTrade({ outcomeId, side })} className="w-full" />
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  );
}
