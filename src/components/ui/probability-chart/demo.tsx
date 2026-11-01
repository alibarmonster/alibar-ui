"use client";

import { ProbabilityChart } from "@/components/ui/probability-chart/probability-chart";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { getMockMarket, useMockMarketFeed } from "@/lib/markets/mock";

const cup = getMockMarket("harbor-cup");
const history = cup.history ?? [];
const annotations = history.length > 80 ? [{ t: history[70].t, label: "Northwind captain returns from injury" }, { t: history[88].t, label: "Atlas win the semi-final" }] : [];

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3">
      <SimulatedBadge />
      {children}
    </div>
  );
}

export function Binary() {
  const market = useMockMarketFeed([getMockMarket("glass-phone")])[0];
  return (
    <Frame>
      <ProbabilityChart market={market} />
    </Frame>
  );
}

export function MultiOutcome() {
  return (
    <Frame>
      <ProbabilityChart market={cup} defaultTimeframe="1M" annotations={annotations} />
    </Frame>
  );
}

export function Compact() {
  return (
    <Frame>
      <ProbabilityChart market={getMockMarket("fusion-demo")} defaultTimeframe="ALL" height={160} className="max-w-md" />
    </Frame>
  );
}
