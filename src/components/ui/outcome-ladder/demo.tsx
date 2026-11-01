"use client";

import { useState } from "react";
import { OutcomeLadder } from "@/components/ui/outcome-ladder/outcome-ladder";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { getMockMarket, useMockMarketFeed } from "@/lib/markets/mock";

function Ladder({ id, interval }: { id: string; interval: number }) {
  const market = useMockMarketFeed([getMockMarket(id)], { interval })[0];
  const [last, setLast] = useState("");
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <SimulatedBadge />
      <p className="text-center text-sm font-medium text-foreground">{market.question}</p>
      <OutcomeLadder market={market} onTrade={(outcomeId, side) => setLast(`${side === "yes" ? "Buy Yes" : "Buy No"} on ${market.outcomes.find((o) => o.id === outcomeId)?.name}`)} />
      <p aria-live="polite" className="h-5 text-[12px] text-muted-foreground">
        {last}
      </p>
    </div>
  );
}

export function LiveOdds() {
  return <Ladder id="harbor-cup" interval={1600} />;
}

export function Awards() {
  return <Ladder id="film-award" interval={2400} />;
}
