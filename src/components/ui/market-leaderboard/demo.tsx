"use client";

import { MarketLeaderboard } from "@/components/ui/market-leaderboard/market-leaderboard";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { mockLeaderboard } from "@/lib/markets/mock";

const data = { week: mockLeaderboard("week"), month: mockLeaderboard("month"), all: mockLeaderboard("all") };

export function TopPredictors() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <SimulatedBadge />
      <MarketLeaderboard data={data} currentUser="@alibar" limit={4} />
    </div>
  );
}

export function FullList() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <SimulatedBadge />
      <MarketLeaderboard data={data} currentUser="@alibar" limit={9} />
    </div>
  );
}
