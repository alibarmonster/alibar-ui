"use client";

import { TradeTicket } from "@/components/ui/trade-ticket/trade-ticket";
import { getMockMarket, useMockMarketFeed } from "@/lib/markets/mock";

export function BuyYes() {
  const market = useMockMarketFeed([getMockMarket("glass-phone")])[0];
  return <TradeTicket market={market} balance={42000} />;
}

export function MultiOutcomeSell() {
  const market = useMockMarketFeed([getMockMarket("harbor-cup")])[0];
  return <TradeTicket market={market} outcomeId="northwind-fc" defaultSide="sell" position={42000} />;
}

export function FailedOrder() {
  const market = getMockMarket("nova-200");
  return <TradeTicket market={market} choice="no" simulateFailure />;
}
