"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring, stagger } from "@/lib/motion";
import { RollingDigits } from "@/components/ui/rolling-digits/rolling-digits";
import { categoryColor } from "@/lib/usage/colors";
import { formatShare, moneyFormat } from "@/lib/usage/format";
import type { UsageResource } from "@/lib/usage/types";

export interface SpendMeterProps {
  /** Spend this period by resource. Amounts are integer minor units (cents; sen for IDR). Up to 6. */
  resources: UsageResource[];
  /** Monthly limit in minor units (controlled). */
  budget?: number;
  /** Starting limit when uncontrolled, in minor units. @default 10000 */
  defaultBudget?: number;
  /** Called with the new limit when − or + is pressed. */
  onBudgetChange?: (budget: number) => void;
  /** How much − and + change the limit, in minor units. @default 2500 */
  step?: number;
  /** Lowest limit, in minor units. @default step */
  min?: number;
  /** Highest limit, in minor units. @default 500000 */
  max?: number;
  /** ISO 4217 currency. @default "USD" */
  currency?: string;
  /** Locale for numbers and money. @default "en-US" */
  locale?: string;
  /** Period shown under the title, e.g. "November 2026". */
  periodLabel?: string;
  /** Card title. @default "Usage" */
  title?: string;
  /** Classes for the card. */
  className?: string;
}

type Level = "ok" | "warning" | "danger";

const LEVEL_TEXT: Record<Level, string> = {
  ok: "text-muted-foreground",
  warning: "text-[color-mix(in_oklab,var(--warning)_70%,var(--foreground))]",
  danger: "text-[color-mix(in_oklab,var(--destructive)_85%,var(--foreground))]",
};

/** clip-path that shows the slice of a full-width bar between `from` and `to` (0–1). */
const slice = (from: number, to: number, gap = 0) =>
  `inset(0% ${(100 - Math.min(1, Math.max(0, to)) * 100 + (to < 1 ? gap : 0)).toFixed(3)}% 0% ${(Math.min(1, Math.max(0, from)) * 100).toFixed(3)}% round 999px)`;

/**
 * A compact monthly usage card for AI and API products: the total against a limit with rolling
 * digits, a segmented meter by resource, linked resource rows and a − / + limit stepper. Turns amber
 * from 75% and red at the limit, where the overflow is hatched.
 */
export function SpendMeter({
  resources,
  budget: budgetProp,
  defaultBudget = 10000,
  onBudgetChange,
  step = 2500,
  min = step,
  max = 500000,
  currency = "USD",
  locale = "en-US",
  periodLabel,
  title = "Usage",
  className,
}: SpendMeterProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [inner, setInner] = useState(defaultBudget);
  const budget = budgetProp ?? inner;
  const [active, setActive] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const money = moneyFormat(currency, locale);

  const total = resources.reduce((sum, r) => sum + r.amount, 0);
  const ratio = budget > 0 ? total / budget : 1;
  const level: Level = ratio >= 1 ? "danger" : ratio >= 0.75 ? "warning" : "ok";
  // The meter spans the limit, or the total once spend runs past it.
  const scale = Math.max(budget, total, 1);
  const limitAt = budget / scale;

  const setBudget = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    if (clamped === budget) return;
    if (budgetProp === undefined) setInner(clamped);
    onBudgetChange?.(clamped);
    setAnnounce(`Monthly limit ${money.format(clamped)}`);
  };

  const shown = resources.slice(0, 6);
  const segments = shown.map((resource, index) => {
    const before = shown.slice(0, index).reduce((sum, r) => sum + r.amount, 0);
    return { resource, index, from: before / scale, to: (before + resource.amount) / scale };
  });

  const segmentTransition = (index: number) =>
    reduceMotion ? { duration: 0 } : { ...spring.smooth, delay: index * stagger.loose };

  return (
    <section aria-labelledby={`${id}-title`} className={cn("w-full max-w-md rounded-2xl border border-border bg-background p-5", className)}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`${id}-title`} className="text-sm font-semibold text-foreground">
            {title}
          </h3>
          {periodLabel ? <p className="mt-0.5 text-[12px] text-muted-foreground">{periodLabel}</p> : null}
        </div>
        <AnimatePresence initial={false} mode="popLayout">
          {level !== "ok" ? (
            <motion.span
              key={level}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.quick, ease: ease.out }}
              className={cn(
                "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium",
                level === "warning" ? "bg-warning/12" : "bg-destructive/10",
                LEVEL_TEXT[level],
              )}
            >
              <span aria-hidden="true" className={cn("size-1.5 rounded-full", level === "warning" ? "bg-warning" : "bg-destructive")} />
              {level === "warning" ? "Approaching limit" : "Limit reached"}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </header>

      <p className="mt-4 text-[12px] text-muted-foreground">Total used</p>
      <p className="mt-0.5 flex items-baseline gap-1.5 font-mono tracking-tight text-foreground">
        <RollingDigits {...money.rolling(total)} animateOnMount={false} className="text-3xl font-semibold" />
        <span className="text-base text-muted-foreground">
          / <RollingDigits {...money.rolling(budget)} animateOnMount={false} />
        </span>
      </p>
      <p className={cn("mt-1 text-[13px] tabular-nums transition-colors", LEVEL_TEXT[level])}>
        {level === "danger" ? (
          <>
            {total > budget ? `${money.format(total - budget)} over the limit` : "The monthly limit is used up"} · {formatShare(ratio)} used
          </>
        ) : (
          <>
            {money.format(budget - total)} remaining this month · {formatShare(ratio)} used
          </>
        )}
      </p>

      {/* Segmented meter. Each segment is a full-width bar clipped to its slice, so it animates clip-path only. */}
      <div
        role="meter"
        aria-label={`${title} against the monthly limit`}
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-valuenow={Math.min(total, budget)}
        aria-valuetext={`${money.format(total)} of ${money.format(budget)} used, ${formatShare(ratio)}`}
        className="relative mt-4 h-3 w-full rounded-full bg-surface-2"
        onMouseLeave={() => setActive(null)}
      >
        {segments.map(({ resource, index, from, to }) => (
          <motion.span
            key={resource.id}
            aria-hidden="true"
            className="absolute inset-0 transition-opacity duration-200"
            style={{ background: categoryColor(index), opacity: active && active !== resource.id ? 0.3 : 1 }}
            initial={reduceMotion ? false : { clipPath: slice(from, from) }}
            animate={{ clipPath: slice(from, to, 0.6) }}
            transition={segmentTransition(index)}
            onMouseEnter={() => setActive(resource.id)}
          />
        ))}
        {total > budget ? (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "repeating-linear-gradient(135deg, color-mix(in oklab, var(--destructive) 70%, transparent) 0 3px, transparent 3px 6px)" }}
            initial={reduceMotion ? false : { clipPath: slice(limitAt, limitAt) }}
            animate={{ clipPath: slice(limitAt, 1) }}
            transition={segmentTransition(segments.length)}
          />
        ) : null}
        {/* The limit mark, once spend has passed it. */}
        {/* A full-width layer moved by a share of its own width, so the mark travels on transform only. */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-y-1 inset-x-0"
          initial={false}
          animate={{ x: `${(limitAt * 100).toFixed(3)}%`, opacity: total > budget ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : spring.smooth}
        >
          <span className="absolute inset-y-0 -left-px w-0.5 rounded-full bg-foreground" />
        </motion.span>
      </div>

      <ul className="mt-4 space-y-1" onMouseLeave={() => setActive(null)}>
        {segments.map(({ resource, index }) => (
          <li
            key={resource.id}
            onMouseEnter={() => setActive(resource.id)}
            className={cn(
              "-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-[background-color,opacity] duration-200",
              active === resource.id && "bg-surface-2",
              active && active !== resource.id && "opacity-55",
            )}
          >
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ background: categoryColor(index) }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">{resource.name}</p>
              {resource.detail ? <p className="truncate text-[12px] text-muted-foreground">{resource.detail}</p> : null}
            </div>
            <span className="font-mono text-[13px] text-foreground tabular-nums">{money.format(resource.amount)}</span>
          </li>
        ))}
      </ul>

      <div role="group" aria-labelledby={`${id}-limit`} className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <span id={`${id}-limit`} className="text-[13px] text-muted-foreground">
          Monthly limit
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Lower the limit by ${money.format(step)}`}
            disabled={budget <= min}
            onClick={() => setBudget(budget - step)}
            className="grid size-9 cursor-pointer place-items-center rounded-full border border-border text-foreground outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="min-w-[5.5rem] text-center font-mono text-sm font-semibold text-foreground">
            <RollingDigits {...money.rolling(budget)} animateOnMount={false} />
          </span>
          <button
            type="button"
            aria-label={`Raise the limit by ${money.format(step)}`}
            disabled={budget >= max}
            onClick={() => setBudget(budget + step)}
            className="grid size-9 cursor-pointer place-items-center rounded-full border border-border text-foreground outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  );
}
