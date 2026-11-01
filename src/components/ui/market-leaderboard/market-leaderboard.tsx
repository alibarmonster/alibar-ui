"use client";

import { useId, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { MarketAvatar } from "@/lib/markets/avatar";
import { formatProbability, formatUsd } from "@/lib/markets/format";

export interface LeaderEntry {
  trader: string;
  /** Profit, cents (can be negative). */
  profit: number;
  /** Volume traded, cents. */
  volume: number;
  /** Share of correct predictions, basis points. */
  accuracy: number;
  /** Rank change since the previous period (positive = moved up). */
  change: number;
}

export type LeaderPeriod = "week" | "month" | "all";
export type LeaderMetric = "profit" | "volume" | "accuracy";

export interface MarketLeaderboardProps {
  /** Entries per period. Simulated data only. */
  data: Record<LeaderPeriod, LeaderEntry[]>;
  /** The viewer's trader name; their row is pinned at the bottom and highlighted. */
  currentUser?: string;
  /** Rows listed under the podium. @default 7 */
  limit?: number;
  /** Classes for the panel. */
  className?: string;
}

const PERIODS: { id: LeaderPeriod; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];
const METRICS: { id: LeaderMetric; label: string }[] = [
  { id: "profit", label: "Profit" },
  { id: "volume", label: "Volume" },
  { id: "accuracy", label: "Accuracy" },
];

/** Arrow keys, Home and End move between tabs (roving tabindex). */
function onTabKey(event: React.KeyboardEvent<HTMLDivElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const i = tabs.findIndex((t) => t === document.activeElement);
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[next]?.focus();
  tabs[next]?.click();
}

const valueOf = (entry: LeaderEntry, metric: LeaderMetric) => (metric === "profit" ? entry.profit : metric === "volume" ? entry.volume : entry.accuracy);
const show = (entry: LeaderEntry, metric: LeaderMetric) => (metric === "accuracy" ? formatProbability(entry.accuracy) : `${metric === "profit" && entry.profit > 0 ? "+" : ""}${formatUsd(valueOf(entry, metric), true)}`);

function Change({ change }: { change: number }) {
  if (!change) return <span className="text-[11px] text-muted-foreground">–</span>;
  return (
    <span className={cn("text-[11px] font-medium tabular-nums", change > 0 ? "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" : "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]")}>
      {change > 0 ? "▲" : "▼"}
      {Math.abs(change)}
      <span className="sr-only">{change > 0 ? " places up" : " places down"}</span>
    </span>
  );
}

/**
 * Top predictors by period and metric: a podium for the top three that rises in, a ranked list that
 * re-sorts with layout animation when the tab or metric changes, and the viewer's row pinned below.
 */
export function MarketLeaderboard({ data, currentUser, limit = 7, className }: MarketLeaderboardProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [period, setPeriod] = useState<LeaderPeriod>("week");
  const [metric, setMetric] = useState<LeaderMetric>("profit");
  const ranked = [...data[period]].sort((a, b) => valueOf(b, metric) - valueOf(a, metric));
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3, 3 + limit);
  const meIndex = currentUser ? ranked.findIndex((e) => e.trader === currentUser) : -1;
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36 };

  return (
    <section aria-label="Leaderboard" className={cn("w-full rounded-2xl border border-border bg-background p-4", className)}>
      <LayoutGroup id={`${id}-p`}>
        <div role="tablist" aria-label="Period" onKeyDown={onTabKey} className="grid grid-cols-3 gap-0.5 rounded-full bg-surface-2 p-0.5">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" role="tab" id={`${id}-tab-${p.id}`} aria-controls={`${id}-panel`} aria-selected={period === p.id} tabIndex={period === p.id ? 0 : -1} onClick={() => setPeriod(p.id)} className={cn("relative h-8 cursor-pointer rounded-full text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", period === p.id ? "text-foreground" : "text-[color-mix(in_oklab,var(--muted-foreground)_75%,var(--foreground))]")}>
              {period === p.id ? <motion.span layoutId="lb-period" transition={spring} className="absolute inset-0 rounded-full bg-background shadow-sm" /> : null}
              <span className="relative">{p.label}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${period}`}>
      <div role="radiogroup" aria-label="Rank by" className="mt-2 flex justify-center gap-1">
        {METRICS.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={metric === m.id} onClick={() => setMetric(m.id)} className={cn("h-7 cursor-pointer rounded-full px-2.5 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring", metric === m.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
            {m.label}
          </button>
        ))}
      </div>
      <ol aria-label="Top three" className="mt-4 grid grid-cols-3 items-end gap-2">
        {[1, 0, 2].map((slot, column) => {
          const entry = podium[slot];
          if (!entry) return <li key={slot} />;
          const heights = ["h-20", "h-14", "h-10"];
          return (
            <motion.li
              key={`${period}-${metric}-${entry.trader}`}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26, delay: reduceMotion ? 0 : column * 0.06 }}
              className="flex flex-col items-center gap-1.5"
            >
              <MarketAvatar name={entry.trader} className={cn(slot === 0 ? "size-12 text-sm" : "size-10 text-xs", entry.trader === currentUser && "ring-2 ring-primary ring-offset-2 ring-offset-background")} />
              <p className="max-w-full truncate text-[12px] font-medium text-foreground">
                {entry.trader}
                {entry.trader === currentUser ? <span className="text-muted-foreground"> (you)</span> : null}
              </p>
              <p className="text-[12px] text-muted-foreground tabular-nums">{show(entry, metric)}</p>
              <div className={cn("flex w-full items-start justify-center rounded-t-xl pt-1.5 text-sm font-bold tabular-nums", heights[slot], slot === 0 ? "bg-[#F2C14E]/30 text-[#8A6516]" : slot === 1 ? "bg-zinc-300/40 text-zinc-600" : "bg-[#C8834B]/25 text-[#8A5426]")}>
                <span className="sr-only">Rank </span>
                {slot + 1}
              </div>
            </motion.li>
          );
        })}
      </ol>
      <LayoutGroup id={`${id}-l`}>
        <ol start={4} className="mt-2 divide-y divide-border">
          {rest.map((entry, i) => (
            <motion.li key={entry.trader} layout={reduceMotion ? false : "position"} transition={spring} className={cn("flex items-center gap-3 py-2", entry.trader === currentUser && "rounded-lg bg-primary/6 px-2")}>
              <span className="w-5 text-[12px] text-muted-foreground tabular-nums">{i + 4}</span>
              <MarketAvatar name={entry.trader} className="size-7" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                {entry.trader}
                {entry.trader === currentUser ? <span className="font-normal text-muted-foreground"> (you)</span> : null}
              </span>
              <Change change={entry.change} />
              <span className="w-20 text-right text-[13px] font-medium text-foreground tabular-nums">{show(entry, metric)}</span>
            </motion.li>
          ))}
        </ol>
      </LayoutGroup>
      {meIndex >= 0 && meIndex >= 3 + limit ? (
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/6 px-2 py-2">
          <span className="w-5 text-[12px] text-muted-foreground tabular-nums">{meIndex + 1}</span>
          <MarketAvatar name={ranked[meIndex].trader} className="size-7" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{ranked[meIndex].trader} (you)</span>
          <Change change={ranked[meIndex].change} />
          <span className="w-20 text-right text-[13px] font-medium text-foreground tabular-nums">{show(ranked[meIndex], metric)}</span>
        </div>
      ) : null}
      </div>
    </section>
  );
}
