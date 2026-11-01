"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Pause, Play, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketActivity } from "@/components/ui/market-activity/market-activity";
import { MarketLeaderboard } from "@/components/ui/market-leaderboard/market-leaderboard";
import { MobileTradeBar } from "@/components/ui/mobile-trade-bar/mobile-trade-bar";
import { OrderBook, type BookLevel } from "@/components/ui/order-book/order-book";
import { OutcomeLadder } from "@/components/ui/outcome-ladder/outcome-ladder";
import { PositionsPanel, type MarketPosition } from "@/components/ui/positions-panel/positions-panel";
import { ProbabilityChart } from "@/components/ui/probability-chart/probability-chart";
import { ResolutionCard } from "@/components/ui/resolution-card/resolution-card";
import { TradeTicket } from "@/components/ui/trade-ticket/trade-ticket";
import { MarketAvatar, SimulatedBadge } from "@/lib/markets/avatar";
import { formatUsd, timeLeft } from "@/lib/markets/format";
import { getMockMarket, mockComments, mockLeaderboard, mockOrderBook, mockPositions, mockTrade, mockTrades, useMockMarketFeed, type MockTrade } from "@/lib/markets/mock";
import type { Market } from "@/lib/markets/types";
import { useNow } from "@/lib/markets/use-now";

const MARKETS = { binary: "glass-phone", multi: "harbor-cup" } as const;
type Kind = keyof typeof MARKETS;
const feedIds = [...new Set([MARKETS.binary, MARKETS.multi, ...mockPositions.map((p) => p.marketId)])];
const feedMarkets = feedIds.map((id) => getMockMarket(id));
const leaders = { week: mockLeaderboard("week"), month: mockLeaderboard("month"), all: mockLeaderboard("all") };
const valueHistory = Array.from({ length: 30 }, (_, i) => 52000 + Math.round(Math.sin(i / 3) * 2600 + i * 310));

function useLiveTrades(market: Market, paused: boolean) {
  const [trades, setTrades] = useState<MockTrade[]>(() => mockTrades(market, 8));
  // The market object changes on every price tick; read the latest one without restarting the timer.
  const latest = useRef(market);
  useEffect(() => {
    latest.current = market;
  });
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTrades((t) => [{ ...mockTrade(latest.current), at: Date.now() }, ...t].slice(0, 20)), 2600);
    return () => window.clearInterval(id);
  }, [paused]);
  return trades;
}

function useLiveBook(price: number, paused: boolean) {
  const [book, setBook] = useState(() => mockOrderBook(price, 3));
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nudge = (levels: BookLevel[]) => levels.map((l) => (Math.random() < 0.3 ? { ...l, shares: Math.max(2000, Math.round(l.shares * (0.7 + Math.random() * 0.6))) } : l));
    const id = window.setInterval(() => setBook((b) => ({ bids: nudge(b.bids), asks: nudge(b.asks) })), 1600);
    return () => window.clearInterval(id);
  }, [paused]);
  return book;
}

function Card({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("rounded-2xl border border-border bg-background p-4", className)}>
      {title ? <h2 className="mb-3 text-sm font-medium text-foreground">{title}</h2> : null}
      {children}
    </section>
  );
}

function MarketBody({ market, kind, paused, positions }: { market: Market; kind: Kind; paused: boolean; positions: MarketPosition[] }) {
  const now = useNow();
  const trades = useLiveTrades(market, paused);
  const book = useLiveBook(market.outcomes[0].price, paused);
  const [watched, setWatched] = useState(false);
  const [pick, setPick] = useState<{ outcomeId: string; choice: "yes" | "no" }>({ outcomeId: market.outcomes[0].id, choice: "yes" });
  const [ticketKey, setTicketKey] = useState(0);
  const choose = (outcomeId: string, choice: "yes" | "no") => {
    setPick({ outcomeId, choice });
    setTicketKey((k) => k + 1);
  };

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <MarketAvatar name={market.question} className="size-14 rounded-2xl text-base" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">{market.topic}</p>
          <h1 className="mt-1 text-2xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-3xl">{market.question}</h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground tabular-nums">
            <span>{formatUsd(market.volume, true)} volume</span>
            <span>{market.traders.toLocaleString("en-US")} traders</span>
            <span>{now ? timeLeft(market.endsAt, now) : " "}</span>
          </p>
        </div>
        <button type="button" aria-pressed={watched} onClick={() => setWatched((w) => !w)} className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 self-start rounded-full border border-border px-4 text-[13px] font-medium text-foreground outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring">
          <Star className={cn("size-4", watched && "fill-warning text-warning")} aria-hidden="true" />
          {watched ? "Watching" : "Watch"}
        </button>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <ProbabilityChart market={market} defaultTimeframe="1W" />
          </Card>
          {kind === "binary" ? (
            <OrderBook bids={book.bids} asks={book.asks} onPriceSelect={(_, b) => choose(market.outcomes[0].id, b)} />
          ) : (
            <OutcomeLadder market={market} onTrade={choose} />
          )}
          <ResolutionCard market={market} stage="open" />
          <MarketActivity trades={trades} comments={mockComments} maxItems={8} />
        </div>
        <aside aria-label="Trade" className="hidden min-w-0 lg:block">
          <div data-sticky-ticket className="sticky top-20">
            <TradeTicket key={`${market.id}-${ticketKey}`} market={market} outcomeId={pick.outcomeId} choice={pick.choice} balance={42000} className="max-w-none" />
          </div>
        </aside>
      </div>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-6 md:grid-cols-2">
        <PositionsPanel positions={positions} cash={12850} valueHistory={valueHistory} />
        <MarketLeaderboard data={leaders} currentUser="@alibar" limit={4} />
      </div>
      <MobileTradeBar market={market} className="lg:hidden" />
    </>
  );
}

/** A full market page assembled from #164–173, with simulated data only. */
export function MarketDetailDemo() {
  const reduceMotion = useReducedMotion();
  const [kind, setKind] = useState<Kind>("binary");
  const [paused, setPaused] = useState(false);
  const live = useMockMarketFeed(feedMarkets, { paused, interval: 2600 });
  const byId = (id: string) => live[feedIds.indexOf(id)];
  const market = byId(MARKETS[kind]);
  const positions: MarketPosition[] = mockPositions.map((p, i) => ({ id: `${p.marketId}-${i}`, market: byId(p.marketId), outcomeId: p.outcomeId, shares: p.shares, averagePrice: p.averagePrice, status: p.status, realized: p.realized }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Link href="/components?category=markets" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            Prediction Markets
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">Market demo</span>
          <SimulatedBadge className="ml-1" />
        </nav>
        <div className="flex items-center gap-2">
          <LayoutGroup id="market-kind">
            <div role="radiogroup" aria-label="Market type" className="flex rounded-full bg-surface-2 p-0.5">
              {(["binary", "multi"] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cn("relative h-8 cursor-pointer rounded-full px-3 text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", kind === k ? "text-foreground" : "text-[color-mix(in_oklab,var(--muted-foreground)_75%,var(--foreground))]")}>
                  {kind === k ? <motion.span layoutId="kind-pill" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }} className="absolute inset-0 rounded-full bg-background shadow-sm" /> : null}
                  <span className="relative">{k === "binary" ? "Yes / No" : "Multi-outcome"}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <button type="button" aria-pressed={paused} onClick={() => setPaused((p) => !p)} className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-[12px] font-medium text-foreground outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring">
            {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
            {paused ? "Resume live data" : "Pause live data"}
          </button>
        </div>
      </div>
      <MarketBody key={market.id} market={market} kind={kind} paused={paused} positions={positions} />
    </div>
  );
}
