"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CloudSun, Clapperboard, Coins, Cpu, FlaskConical, MessageCircle, Sparkles, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketAvatar } from "@/lib/markets/avatar";
import { formatChange, formatPrice, formatProbability, formatUsd, timeLeft } from "@/lib/markets/format";
import { FULL, quoteBuy } from "@/lib/markets/math";
import type { Market } from "@/lib/markets/types";
import { useNow } from "@/lib/markets/use-now";
import { RollingValue } from "@/lib/web3/rolling-value";

export type TradeChoice = "yes" | "no";

export interface MarketCardProps {
  /** The market: binary (Yes/No) or multi-outcome. Prices in basis points, money in cents. */
  market: Market;
  /** The star is filled. */
  watched?: boolean;
  /** Fires when the star is toggled. */
  onWatchChange?: (watched: boolean) => void;
  /** Fires when a trade button is pressed: the outcome and whether it buys Yes or No. */
  onTrade?: (market: Market, outcomeId: string, side: TradeChoice) => void;
  /** "compact" trims padding and shows a sparkline instead of the gauge. @default "default" */
  variant?: "default" | "compact";
  /** Shows a skeleton while the market loads. @default false */
  loading?: boolean;
  /** Classes for the card. */
  className?: string;
}

/** Shared layout id: give the Trade Ticket the same id and the pressed button morphs into it. */
export const tradeLayoutId = (marketId: string, outcomeId: string, side: TradeChoice) => `trade-${marketId}-${outcomeId}-${side}`;

const TOPIC_ICONS: Record<string, ReactNode> = {
  tech: <Cpu />,
  sports: <Trophy />,
  culture: <Clapperboard />,
  science: <FlaskConical />,
  weather: <CloudSun />,
  crypto: <Coins />,
};

function Gauge({ value }: { value: number }) {
  // Semicircle: the arc length is π·r; the filled part follows the probability.
  const r = 34;
  const length = Math.PI * r;
  return (
    <svg viewBox="0 0 80 44" className="h-11 w-20" aria-hidden="true">
      <path d={`M6 40 A${r} ${r} 0 0 1 74 40`} fill="none" stroke="var(--surface-2)" strokeWidth="7" strokeLinecap="round" />
      <path
        d={`M6 40 A${r} ${r} 0 0 1 74 40`}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - value / FULL)}
        className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const d = points.map((p, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * 80).toFixed(1)} ${(24 - ((p - min) / Math.max(1, max - min)) * 22).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 80 26" className="h-7 w-20" aria-hidden="true">
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function TradeButton({ market, outcomeId, side, price, label, onTrade, compact }: { market: Market; outcomeId: string; side: TradeChoice; price: number; label: string; onTrade?: MarketCardProps["onTrade"]; compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const quote = quoteBuy(price, 10000, market.liquidity);
  return (
    <span className="group/trade relative flex-1">
      <motion.button
        layoutId={tradeLayoutId(market.id, outcomeId, side)}
        type="button"
        onClick={() => onTrade?.(market, outcomeId, side)}
        whileHover={reduceMotion ? undefined : { y: -2 }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        className={cn(
          "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "h-9 text-[13px]" : "h-10 text-sm",
          side === "yes" ? "bg-success/12 text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))] hover:bg-success/18" : "bg-destructive/10 text-[color-mix(in_oklab,var(--destructive)_75%,var(--foreground))] hover:bg-destructive/15",
        )}
      >
        {label} <span className="tabular-nums">{formatPrice(price)}</span>
      </motion.button>
      {/* Payout preview for $100. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 translate-y-1 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium whitespace-nowrap text-background opacity-0 transition-[opacity,translate] duration-150 group-hover/trade:translate-y-0 group-hover/trade:opacity-100 group-has-[:focus-visible]/trade:translate-y-0 group-has-[:focus-visible]/trade:opacity-100"
      >
        $100 → {formatUsd(quote.payout)}
      </span>
    </span>
  );
}

/**
 * The core unit of a prediction feed: topic, question, odds (gauge or outcome bars), Yes/No buttons
 * with a payout preview, and volume, traders and countdown. Data is passed in; nothing is traded here.
 */
export function MarketCard({ market, watched = false, onWatchChange, onTrade, variant = "default", loading = false, className }: MarketCardProps) {
  const reduceMotion = useReducedMotion();
  const now = useNow();
  const [pop, setPop] = useState(0);
  const compact = variant === "compact";
  const topicKey = market.topic.toLowerCase();

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading market" className={cn("rounded-2xl border border-border bg-background p-4", className)}>
        <div className="flex gap-3">
          <div className="size-10 animate-pulse rounded-xl bg-surface-2 motion-reduce:animate-none" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
            <div className="h-4 w-full animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
          </div>
        </div>
        <div className="mt-5 h-10 animate-pulse rounded-xl bg-surface-2 motion-reduce:animate-none" />
        <div className="mt-4 flex gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-surface-2 motion-reduce:animate-none" />
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-surface-2 motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  const binary = market.type === "binary";
  const [yes, no] = market.outcomes;
  const resolved = market.status === "resolved";
  const winner = market.outcomes.find((o) => o.id === market.resolvedOutcomeId);
  const sorted = [...market.outcomes].sort((a, b) => b.price - a.price);
  const spark = (market.history ?? []).slice(-24).map((point) => point.prices[0]);

  return (
    <article className={cn("relative flex flex-col rounded-2xl border border-border bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04)]", compact ? "p-3.5" : "p-4", className)}>
      <header className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2 text-muted-foreground [&>svg]:size-5">
          {market.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic
            <img src={market.image} alt="" className="size-full object-cover" />
          ) : (
            (TOPIC_ICONS[topicKey] ?? <Sparkles />)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 [&>svg]:size-3">
              {TOPIC_ICONS[topicKey] ?? <Sparkles />}
              {market.topic}
            </span>
            {market.status === "closing" ? (
              <span className="inline-flex items-center gap-1 text-[color-mix(in_oklab,var(--warning)_80%,var(--foreground))]">
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-warning opacity-70 motion-reduce:animate-none" />
                  <span className="relative size-1.5 rounded-full bg-warning" />
                </span>
                Closing soon
              </span>
            ) : null}
          </p>
          <p className={cn("mt-0.5 line-clamp-2 font-medium text-balance text-foreground", compact ? "text-sm" : "text-[15px] leading-snug")}>{market.question}</p>
        </div>
        <motion.button
          type="button"
          aria-pressed={watched}
          aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
          onClick={() => {
            setPop((n) => n + 1);
            onWatchChange?.(!watched);
          }}
          className="-mt-1 -mr-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground outline-none hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <motion.span key={pop} initial={pop && !reduceMotion ? { scale: 0.6 } : false} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
            <Star className={cn("size-4", watched && "fill-warning text-warning")} aria-hidden="true" />
          </motion.span>
        </motion.button>
      </header>

      {binary ? (
        <div className={cn("flex items-end justify-between gap-3", compact ? "mt-3" : "mt-4")}>
          <div>
            <p className="flex items-baseline gap-1.5">
              <span className={cn("font-semibold tracking-tight text-foreground tabular-nums", compact ? "text-2xl" : "text-3xl")}>
                <RollingValue value={formatProbability(resolved && winner ? (winner.id === yes.id ? FULL : 0) : yes.price)} trend={yes.price} />
              </span>
              <span className="text-[13px] text-muted-foreground">chance</span>
            </p>
            {yes.change24h !== undefined && !resolved ? (
              <p className={cn("mt-0.5 text-[12px] font-medium tabular-nums", yes.change24h >= 0 ? "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" : "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]")}>
                {formatChange(yes.change24h)} <span className="font-normal text-muted-foreground">24h</span>
              </p>
            ) : null}
          </div>
          {compact ? <Sparkline points={spark} /> : <Gauge value={resolved && winner ? (winner.id === yes.id ? FULL : 0) : yes.price} />}
        </div>
      ) : (
        <ul className={cn("space-y-2", compact ? "mt-3" : "mt-4")}>
          {sorted.slice(0, 3).map((outcome) => (
            <li key={outcome.id} className="flex items-center gap-2.5">
              <span className="w-28 shrink-0 truncate text-[13px] text-foreground">{outcome.name}</span>
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <motion.span
                  className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-primary"
                  initial={false}
                  animate={{ scaleX: outcome.price / FULL }}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 24 }}
                />
              </span>
              <span className="w-11 text-right text-[13px] font-medium text-foreground tabular-nums">
                <RollingValue value={formatProbability(outcome.price)} trend={outcome.price} />
              </span>
            </li>
          ))}
          {sorted.length > 3 ? <li className="text-[12px] text-muted-foreground">+{sorted.length - 3} more</li> : null}
        </ul>
      )}

      {resolved ? (
        <div className={cn("relative flex items-center justify-between rounded-xl border border-border bg-surface px-3", compact ? "mt-3 h-9" : "mt-4 h-10")}>
          <p className="text-[13px] text-muted-foreground">Market resolved</p>
          <motion.span
            initial={reduceMotion ? false : { scale: 1.6, rotate: -14, opacity: 0 }}
            animate={{ scale: 1, rotate: -6, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.1 }}
            className="rounded-md border-2 border-success px-2 py-0.5 text-[12px] font-bold tracking-wide text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))] uppercase"
          >
            Resolved: {winner?.name ?? "—"}
          </motion.span>
        </div>
      ) : binary ? (
        <div className={cn("flex gap-2", compact ? "mt-3" : "mt-4")}>
          <TradeButton market={market} outcomeId={yes.id} side="yes" price={yes.price} label="Yes" onTrade={onTrade} compact={compact} />
          <TradeButton market={market} outcomeId={yes.id} side="no" price={no.price} label="No" onTrade={onTrade} compact={compact} />
        </div>
      ) : (
        <div className={cn("flex gap-2", compact ? "mt-3" : "mt-4")}>
          <TradeButton market={market} outcomeId={sorted[0].id} side="yes" price={sorted[0].price} label={`${sorted[0].name.split(" ")[0]}`} onTrade={onTrade} compact={compact} />
          <TradeButton market={market} outcomeId={sorted[1].id} side="yes" price={sorted[1].price} label={`${sorted[1].name.split(" ")[0]}`} onTrade={onTrade} compact={compact} />
        </div>
      )}

      <footer className={cn("flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] whitespace-nowrap text-muted-foreground", compact ? "mt-3" : "mt-4")}>
        <span className="tabular-nums">{formatUsd(market.volume, true)} vol</span>
        {!compact && market.traderNames?.length ? (
          <span className="flex items-center gap-1.5">
            <span className="flex -space-x-2">
              {market.traderNames.slice(0, 3).map((name) => (
                <MarketAvatar key={name} name={name} className="size-5 text-[8px]" />
              ))}
            </span>
            <span className="tabular-nums">{market.traders.toLocaleString("en-US")}</span>
          </span>
        ) : null}
        <span className="tabular-nums">{now ? timeLeft(market.endsAt, now) : " "}</span>
        {market.comments !== undefined ? (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <MessageCircle className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Comments:</span>
            {market.comments}
          </span>
        ) : null}
      </footer>
    </article>
  );
}
