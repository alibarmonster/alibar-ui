"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketAvatar } from "@/lib/markets/avatar";
import { formatPrice, formatProbability, formatUsd } from "@/lib/markets/format";
import { FULL, complement } from "@/lib/markets/math";
import type { Market } from "@/lib/markets/types";
import { RollingValue } from "@/lib/web3/rolling-value";

export interface OutcomeLadderProps {
  /** A multi-outcome market (binary markets show their two outcomes). */
  market: Market;
  /** Fires when Yes or No is pressed on an outcome. */
  onTrade?: (outcomeId: string, side: "yes" | "no") => void;
  /** Classes for the list. */
  className?: string;
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const d = values.map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * 200).toFixed(1)} ${(36 - ((v - min) / Math.max(1, max - min)) * 32).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 200 40" className="h-10 w-full" aria-hidden="true" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * Outcomes as a ladder sorted by probability. When the odds change, rows re-sort with a layout
 * animation and the row that moved flashes; each row expands to a mini chart and its volume.
 */
export function OutcomeLadder({ market, onTrade, className }: OutcomeLadderProps) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);
  const [moved, setMoved] = useState<string | null>(null);
  const previous = useRef<string[]>([]);
  const sorted = [...market.outcomes].sort((a, b) => b.price - a.price);
  const order = sorted.map((o) => o.id).join("|");

  // Highlight the outcome whose rank changed (from a timer callback, never during render).
  useEffect(() => {
    const ids = order.split("|");
    const before = previous.current;
    previous.current = ids;
    if (!before.length) return;
    const changed = ids.find((id, i) => before[i] !== id && before.indexOf(id) > i);
    if (!changed) return;
    const show = window.setTimeout(() => setMoved(changed), 0);
    const hide = window.setTimeout(() => setMoved(null), 1200);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [order]);

  return (
    <LayoutGroup>
      <ul aria-label={`Outcomes for ${market.question}`} className={cn("w-full divide-y divide-border rounded-2xl border border-border bg-background", className)}>
        {sorted.map((outcome, rank) => {
          const index = market.outcomes.indexOf(outcome);
          const expanded = open === outcome.id;
          const spark = (market.history ?? []).slice(-30).map((p) => p.prices[index] ?? 0);
          return (
            <motion.li key={outcome.id} layout={reduceMotion ? false : "position"} transition={{ type: "spring", stiffness: 380, damping: 34 }} className={cn("relative transition-colors duration-700", moved === outcome.id && "bg-primary/6")}>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-4 text-[12px] text-muted-foreground tabular-nums">{rank + 1}</span>
                <MarketAvatar name={outcome.name} className="size-8" />
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : outcome.id)}
                  className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex w-full items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-foreground">{outcome.name}</span>
                    <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} aria-hidden="true" />
                  </span>
                  <span className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <motion.span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-primary" initial={false} animate={{ scaleX: outcome.price / FULL }} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 24 }} />
                  </span>
                </button>
                <span className="w-12 text-right text-sm font-semibold text-foreground tabular-nums">
                  <RollingValue value={formatProbability(outcome.price)} trend={outcome.price} />
                </span>
                <span className="hidden gap-1.5 sm:flex">
                  <button type="button" aria-label={`Yes ${formatPrice(outcome.price)} on ${outcome.name}`} onClick={() => onTrade?.(outcome.id, "yes")} className="h-8 w-[4.25rem] cursor-pointer rounded-lg bg-success/12 text-[12px] font-medium tabular-nums text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))] outline-none hover:bg-success/18 focus-visible:ring-2 focus-visible:ring-ring">
                    Yes {formatPrice(outcome.price)}
                  </button>
                  <button type="button" aria-label={`No ${formatPrice(complement(outcome.price))} on ${outcome.name}`} onClick={() => onTrade?.(outcome.id, "no")} className="h-8 w-[4.25rem] cursor-pointer rounded-lg bg-destructive/10 text-[12px] font-medium tabular-nums text-[color-mix(in_oklab,var(--destructive)_75%,var(--foreground))] outline-none hover:bg-destructive/15 focus-visible:ring-2 focus-visible:ring-ring">
                    No {formatPrice(complement(outcome.price))}
                  </button>
                </span>
              </div>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, gridTemplateRows: "0fr" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, gridTemplateRows: "1fr" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, gridTemplateRows: "0fr" }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="grid"
                  >
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-4 px-3 pb-3 pl-[3.75rem]">
                        <div className="flex-1">
                          <Spark values={spark} />
                        </div>
                        <dl className="text-right text-[12px]">
                          <dt className="text-muted-foreground">Volume</dt>
                          <dd className="font-medium text-foreground tabular-nums">{formatUsd(outcome.volume ?? 0, true)}</dd>
                        </dl>
                      </div>
                      <div className="flex gap-1.5 px-3 pb-3 pl-[3.75rem] sm:hidden">
                        <button type="button" aria-label={`Yes ${formatPrice(outcome.price)} on ${outcome.name}`} onClick={() => onTrade?.(outcome.id, "yes")} className="h-10 flex-1 cursor-pointer rounded-lg bg-success/12 text-[12px] font-medium text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))] outline-none hover:bg-success/18 focus-visible:ring-2 focus-visible:ring-ring">
                          Yes {formatPrice(outcome.price)}
                        </button>
                        <button type="button" aria-label={`No ${formatPrice(complement(outcome.price))} on ${outcome.name}`} onClick={() => onTrade?.(outcome.id, "no")} className="h-10 flex-1 cursor-pointer rounded-lg bg-destructive/10 text-[12px] font-medium text-[color-mix(in_oklab,var(--destructive)_75%,var(--foreground))] outline-none hover:bg-destructive/15 focus-visible:ring-2 focus-visible:ring-ring">
                          No {formatPrice(complement(outcome.price))}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>
    </LayoutGroup>
  );
}
