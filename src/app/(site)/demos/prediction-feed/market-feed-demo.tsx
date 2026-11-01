"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Pause, Play, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketCard, tradeLayoutId, type TradeChoice } from "@/components/ui/market-card/market-card";
import { TradeTicket } from "@/components/ui/trade-ticket/trade-ticket";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { mockMarkets, useMockMarketFeed } from "@/lib/markets/mock";

const topics = ["All", ...new Set(mockMarkets.map((m) => m.topic))];

/** A market feed: topic chips, search, a watchlist filter and a card-to-ticket trade overlay. */
export function MarketFeedDemo() {
  const reduceMotion = useReducedMotion();
  const [topic, setTopic] = useState("All");
  const [query, setQuery] = useState("");
  const [watchOnly, setWatchOnly] = useState(false);
  const [paused, setPaused] = useState(false);
  const [watched, setWatched] = useState<Record<string, boolean>>({ "glass-phone": true, "harbor-cup": true });
  const [trade, setTrade] = useState<{ marketId: string; outcomeId: string; side: TradeChoice } | null>(null);
  const live = useMockMarketFeed(mockMarkets, { paused: paused || trade !== null, interval: 2800 });
  const lastTrade = useRef<{ marketId: string; side: TradeChoice } | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const shown = live.filter((m) => (topic === "All" || m.topic === topic) && (!watchOnly || watched[m.id]) && (!q || m.question.toLowerCase().includes(q) || m.outcomes.some((o) => o.name.toLowerCase().includes(q))));
  const watchCount = Object.values(watched).filter(Boolean).length;
  const active = trade ? live.find((m) => m.id === trade.marketId) : undefined;
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36 };

  // The card is swapped for a placeholder while its ticket is open (the button morphs into the
  // ticket), so focus goes back to the matching button of the re-mounted card.
  const refocus = () =>
    requestAnimationFrame(() => {
      const last = lastTrade.current;
      const card = last && document.querySelector(`[data-market="${last.marketId}"]`);
      if (!card || !last) return;
      const buttons = Array.from(card.querySelectorAll<HTMLButtonElement>("button"));
      (buttons.find((b) => b.textContent?.trim().toLowerCase().startsWith(last.side)) ?? buttons[0])?.focus();
    });
  const close = () => {
    setTrade(null);
    refocus();
  };

  useEffect(() => {
    if (!trade) return;
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setTrade(null);
      refocus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trade]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link href="/components?category=markets" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          Prediction Markets
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">Feed demo</span>
      </nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground">
            Markets <SimulatedBadge />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Fictional questions with simulated prices. Nothing here is real money.</p>
        </div>
        <button type="button" aria-pressed={paused} onClick={() => setPaused((p) => !p)} className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-[12px] font-medium text-foreground outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring">
          {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
          {paused ? "Resume live prices" : "Pause live prices"}
        </button>
      </div>

      <div className="sticky top-14 z-20 -mx-4 mt-5 flex flex-col gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:flex-row md:items-center">
        <label className="relative block md:w-72">
          <span className="sr-only">Search markets</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search markets or outcomes" className="h-10 w-full rounded-full border border-border bg-background pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
        </label>
        <LayoutGroup id="feed-topics">
          <div role="radiogroup" aria-label="Topic" className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 py-0.5 [scrollbar-width:none]">
            {topics.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={topic === t} onClick={() => setTopic(t)} className={cn("relative h-9 shrink-0 cursor-pointer rounded-full px-3.5 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", topic === t ? "text-background" : "text-muted-foreground hover:text-foreground")}>
                {topic === t ? <motion.span layoutId="topic-pill" transition={spring} className="absolute inset-0 rounded-full bg-foreground" /> : null}
                <span className="relative">{t}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <button type="button" aria-pressed={watchOnly} onClick={() => setWatchOnly((w) => !w)} className={cn("inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-full border px-3.5 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring md:self-auto", watchOnly ? "border-warning/40 bg-warning/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
          <Star className={cn("size-4", watchOnly && "fill-warning text-warning")} aria-hidden="true" />
          Watchlist <span className="tabular-nums">{watchCount}</span>
        </button>
      </div>

      <p aria-live="polite" className="sr-only">
        {shown.length} {shown.length === 1 ? "market" : "markets"} shown
      </p>
      <LayoutGroup id="feed">
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((m) => (
              <motion.li key={m.id} data-market={m.id} layout={reduceMotion ? false : "position"} initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }} transition={spring}>
                {trade?.marketId === m.id ? (
                  <div className="h-full min-h-48 rounded-2xl border border-dashed border-border" />
                ) : (
                  <MarketCard
                    market={m}
                    watched={!!watched[m.id]}
                    onWatchChange={(w) => setWatched((s) => ({ ...s, [m.id]: w }))}
                    onTrade={(_, outcomeId, side) => {
                      lastTrade.current = { marketId: m.id, side };
                      setTrade({ marketId: m.id, outcomeId, side });
                    }}
                    className="h-full"
                  />
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {shown.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">No markets match</p>
            <p className="text-[13px] text-muted-foreground">{watchOnly ? "Star a market to add it to your watchlist." : "Try another topic or search term."}</p>
            <button
              type="button"
              onClick={() => {
                setTopic("All");
                setQuery("");
                setWatchOnly(false);
              }}
              className="mt-2 h-9 cursor-pointer rounded-full border border-border px-4 text-[13px] font-medium text-foreground outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear filters
            </button>
          </div>
        ) : null}

        <AnimatePresence>
          {trade && active ? (
            <motion.div key="overlay" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div aria-hidden="true" className="absolute inset-0 bg-black/30" onClick={close} />
              <div ref={dialog} role="dialog" aria-modal="true" aria-label="Trade" tabIndex={-1} className="relative w-full max-w-sm outline-none">
                <TradeTicket market={active} outcomeId={trade.outcomeId} choice={trade.side} layoutId={tradeLayoutId(active.id, trade.outcomeId, trade.side)} balance={42000} onClose={close} className="shadow-2xl" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
