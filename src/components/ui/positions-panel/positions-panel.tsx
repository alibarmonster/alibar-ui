"use client";

import { useId, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatPrice, formatShares, formatUsd } from "@/lib/markets/format";
import { profitAndLoss, valueOf } from "@/lib/markets/math";
import type { Market } from "@/lib/markets/types";
import { RollingValue } from "@/lib/web3/rolling-value";

export interface MarketPosition {
  id: string;
  market: Market;
  outcomeId: string;
  /** Shares held, in hundredths. */
  shares: number;
  /** Average buy price, basis points. */
  averagePrice: number;
  status: "open" | "won" | "lost" | "closed";
  /** Realized P&L for closed positions, cents. */
  realized?: number;
}

export interface PositionsPanelProps {
  /** Positions with their markets. Simulated data only. */
  positions: MarketPosition[];
  /** Cash balance included in the portfolio total, cents. @default 0 */
  cash?: number;
  /** Portfolio value over time for the header sparkline, cents. */
  valueHistory?: number[];
  /** Fires when Sell is pressed on an open position. */
  onSell?: (position: MarketPosition) => void;
  /** Fires when a winning position is claimed. */
  onClaim?: (position: MarketPosition) => void;
  /** Fires from the empty state's call to action. */
  onExplore?: () => void;
  /** Classes for the panel. */
  className?: string;
}

type Tab = "open" | "resolved" | "history";

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

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const d = values.map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * 96).toFixed(1)} ${(26 - ((v - min) / Math.max(1, max - min)) * 22).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 96 28" className="h-7 w-24" aria-hidden="true">
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Coins() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: 10 }, (_, i) => {
        const angle = -Math.PI / 2 + ((i - 4.5) / 9) * 2.2;
        return (
          <motion.span
            key={i}
            className="absolute top-1/2 left-1/2 size-2.5 rounded-full border border-[#B98A1E] bg-[#F2C14E]"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: Math.cos(angle) * 56, y: Math.sin(angle) * 44 + 20, opacity: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.015 }}
          />
        );
      })}
    </span>
  );
}

/**
 * A portfolio of prediction market positions: Open (live P&L and Sell), Resolved (claim winnings
 * with a coin burst; losses dimmed) and History, under a portfolio total with a sparkline.
 */
export function PositionsPanel({ positions, cash = 0, valueHistory = [], onSell, onClaim, onExplore, className }: PositionsPanelProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<Tab>("open");
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [burst, setBurst] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const outcomeOf = (p: MarketPosition) => p.market.outcomes.find((o) => o.id === p.outcomeId) ?? p.market.outcomes[0];
  const open = positions.filter((p) => p.status === "open");
  const resolved = positions.filter((p) => p.status === "won" || p.status === "lost");
  const history = positions.filter((p) => p.status === "closed");
  const claimedTotal = resolved.filter((p) => p.status === "won" && claimed[p.id]).reduce((sum, p) => sum + p.shares, 0);
  const total = cash + claimedTotal + open.reduce((sum, p) => sum + valueOf(p.shares, outcomeOf(p).price), 0);
  const lists: Record<Tab, MarketPosition[]> = { open, resolved, history };
  const list = lists[tab];

  const claim = (p: MarketPosition) => {
    setClaimed((c) => ({ ...c, [p.id]: true }));
    setAnnounce(`Claimed ${formatUsd(p.shares)}`);
    if (!reduceMotion) {
      setBurst(p.id);
      window.setTimeout(() => setBurst((b) => (b === p.id ? null : b)), 900);
    }
    onClaim?.(p);
  };

  return (
    <section aria-label="Positions" className={cn("w-full rounded-2xl border border-border bg-background", className)}>
      <header className="flex items-end justify-between gap-3 border-b border-border p-4">
        <div>
          <p className="text-[12px] text-muted-foreground">Portfolio value</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            <RollingValue value={formatUsd(total)} trend={total} />
          </p>
        </div>
        <Spark values={valueHistory} />
      </header>
      <LayoutGroup id={id}>
        <div role="tablist" aria-label="Positions" onKeyDown={onTabKey} className="mx-4 mt-3 grid grid-cols-3 gap-0.5 rounded-full bg-surface-2 p-0.5">
          {(["open", "resolved", "history"] as const).map((t) => (
            <button key={t} type="button" role="tab" id={`${id}-tab-${t}`} aria-controls={`${id}-panel`} aria-selected={tab === t} tabIndex={tab === t ? 0 : -1} onClick={() => setTab(t)} className={cn("relative h-8 cursor-pointer rounded-full text-[13px] font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring", tab === t ? "text-foreground" : "text-[color-mix(in_oklab,var(--muted-foreground)_75%,var(--foreground))]")}>
              {tab === t ? <motion.span layoutId="positions-tab" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }} className="absolute inset-0 rounded-full bg-background shadow-sm" /> : null}
              <span className="relative">
                {t} <span className="tabular-nums opacity-80">{lists[t].length}</span>
              </span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`} className="p-2">
        {list.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <svg viewBox="0 0 80 56" className="h-14 w-20 text-muted-foreground" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="8" y="10" width="64" height="40" rx="8" opacity="0.4" />
              <path d="M18 38l10-10 8 6 14-14 12 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-3 text-sm font-medium text-foreground">No {tab === "open" ? "open positions" : tab === "resolved" ? "resolved markets" : "history"} yet</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Make a prediction to see it here.</p>
            {onExplore ? (
              <button type="button" onClick={onExplore} className="mt-4 h-9 cursor-pointer rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Explore markets
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            <AnimatePresence initial={false} mode="popLayout">
              {list.map((p) => {
                const outcome = outcomeOf(p);
                const { value, pnl, pnlBps } = profitAndLoss(p.shares, p.averagePrice, outcome.price);
                const up = (p.status === "closed" ? (p.realized ?? 0) : pnl) >= 0;
                const lost = p.status === "lost";
                return (
                  <motion.li key={p.id} layout="position" initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("flex items-center gap-3 px-2 py-3", lost && "opacity-50")}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">{p.market.question}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted-foreground tabular-nums">
                        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-foreground">{outcome.name}</span>
                        {formatShares(p.shares)} shares · {formatPrice(p.averagePrice)} → {p.status === "open" ? formatPrice(outcome.price) : p.status === "won" ? "100¢" : p.status === "lost" ? "0¢" : "sold"}
                      </p>
                    </div>
                    {p.status === "open" ? (
                      <>
                        <div className="text-right text-[12px] tabular-nums">
                          <p className="font-medium text-foreground">
                            <RollingValue value={formatUsd(value)} trend={value} />
                          </p>
                          <p className={up ? "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" : "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]"}>
                            {up ? "▲" : "▼"} <RollingValue value={formatUsd(Math.abs(pnl))} trend={pnl} flash={false} /> ({(Math.abs(pnlBps) / 100).toFixed(1)}%)
                          </p>
                        </div>
                        <button type="button" onClick={() => onSell?.(p)} className="h-8 shrink-0 cursor-pointer rounded-full border border-border px-3 text-[12px] font-medium text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring">
                          Sell
                        </button>
                      </>
                    ) : p.status === "won" ? (
                      <span className="relative">
                        <button
                          type="button"
                          disabled={claimed[p.id]}
                          onClick={() => claim(p)}
                          className="h-8 shrink-0 cursor-pointer rounded-full bg-[color-mix(in_oklab,var(--success)_78%,var(--foreground))] px-3 text-[12px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:bg-surface-2 disabled:text-muted-foreground"
                        >
                          {claimed[p.id] ? "Claimed" : `Claim ${formatUsd(p.shares)}`}
                        </button>
                        {burst === p.id ? <Coins /> : null}
                      </span>
                    ) : p.status === "lost" ? (
                      <span className="text-[12px] text-muted-foreground">Lost {formatUsd(valueOf(p.shares, p.averagePrice))}</span>
                    ) : (
                      <span className={cn("text-[12px] font-medium tabular-nums", up ? "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" : "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]")}>
                        {up ? "▲ +" : "▼ −"}
                        {formatUsd(Math.abs(p.realized ?? 0))}
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  );
}
