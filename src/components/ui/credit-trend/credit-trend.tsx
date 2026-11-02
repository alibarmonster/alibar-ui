"use client";

import { useId, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";
import { RollingDigits } from "@/components/ui/rolling-digits/rolling-digits";
import { Sparkline } from "@/components/ui/sparkline/sparkline";
import { categoryColor } from "@/lib/usage/colors";
import { formatCredits, formatCreditsCompact, formatDay } from "@/lib/usage/format";
import type { DailyUsage, UsageCategory, UsageWorkflow } from "@/lib/usage/types";

export type CreditTrendRange = "14d" | "cycle";

export interface CreditTrendProps {
  /** Credit categories in color order (max 6). Each day's `values` are keyed by these ids. */
  categories: UsageCategory[];
  /** Every day of the billing cycle, oldest first. Days after today have empty `values`. */
  days: DailyUsage[];
  /** ISO date of today. @default the last day with any values */
  today?: string;
  /** Credits per day the plan allows; drawn as a dashed line. */
  dailyBudget: number;
  /** ISO date the cycle renews, for the projection tile. @default the day after the last day */
  renewsOn?: string;
  /** Workflows for the "Top workflows" list; leave out to hide it. */
  workflows?: UsageWorkflow[];
  /** Range shown first. @default "14d" */
  defaultRange?: CreditTrendRange;
  /** Called when the range toggle changes. */
  onRangeChange?: (range: CreditTrendRange) => void;
  /** How many workflows to list. @default 4 */
  workflowCount?: number;
  /** Locale for numbers and dates. @default "en-US" */
  locale?: string;
  /** Card title. @default "Credit usage" */
  title?: string;
  /** Classes for the card. */
  className?: string;
}

/** clip-path showing the band of a full-height bar between `from` and `to` (0–1, from the bottom). */
const band = (from: number, to: number) =>
  `inset(${(100 - Math.min(1, to) * 100).toFixed(3)}% 0% ${(Math.min(1, from) * 100).toFixed(3)}% 0% round 3px)`;

function addDays(iso: string, n: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/**
 * Daily credit spend for the current billing cycle: used, average and projected tiles with rolling
 * digits, a stacked bar per day by category against a dashed daily budget, a scrubbable day card,
 * category toggles that re-stack the bars, and the top workflows with sparklines.
 */
export function CreditTrend({
  categories,
  days,
  today,
  dailyBudget,
  renewsOn,
  workflows = [],
  defaultRange = "14d",
  onRangeChange,
  workflowCount = 4,
  locale = "en-US",
  title = "Credit usage",
  className,
}: CreditTrendProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [range, setRange] = useState<CreditTrendRange>(defaultRange);
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<number | null>(null);
  const [focusCategory, setFocusCategory] = useState<string | null>(null);

  const cats = categories.slice(0, 6);
  const lastWithData = days.reduce((last, d, i) => (Object.keys(d.values).length ? i : last), 0);
  const todayIndex = today ? Math.max(0, days.findIndex((d) => d.date === today)) : lastWithData;
  const renewal = renewsOn ?? (days.length ? addDays(days[days.length - 1].date, 1) : "");
  const enabled = cats.filter((c) => !off[c.id]);
  const totalOf = (d: DailyUsage) => enabled.reduce((sum, c) => sum + (d.values[c.id] ?? 0), 0);

  const start = range === "14d" ? Math.max(0, todayIndex - 13) : 0;
  const end = range === "14d" ? todayIndex + 1 : days.length;
  const visible = days.slice(start, end);
  const past = visible.filter((_, i) => start + i <= todayIndex);

  const usedSoFar = days.slice(0, todayIndex + 1).reduce((sum, d) => sum + totalOf(d), 0);
  const average = past.length ? Math.round(past.reduce((sum, d) => sum + totalOf(d), 0) / past.length) : 0;
  const remaining = Math.max(0, days.length - 1 - todayIndex);
  const projected = usedSoFar + average * remaining;
  const cycleBudget = dailyBudget * days.length;
  const onPace = projected <= cycleBudget;
  const max = Math.max(dailyBudget, ...visible.map(totalOf), 1) * 1.12;

  const pick = (next: CreditTrendRange) => {
    if (next === range) return;
    setRange(next);
    setActive(null);
    onRangeChange?.(next);
  };

  const toggle = (categoryId: string) =>
    setOff((o) => {
      // Keep at least one category on.
      if (!o[categoryId] && enabled.length === 1) return o;
      return { ...o, [categoryId]: !o[categoryId] };
    });

  const onChartKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, (i: number) => number> = {
      ArrowLeft: (i) => i - 1,
      ArrowRight: (i) => i + 1,
      Home: () => 0,
      End: () => visible.length - 1,
    };
    const move = keys[event.key];
    if (!move) return;
    event.preventDefault();
    setActive((i) => Math.min(visible.length - 1, Math.max(0, move(i ?? todayIndex - start))));
  };

  const activeDay = active !== null ? visible[active] : undefined;
  const activeFuture = active !== null && start + active > todayIndex;
  const position = active !== null ? (active + 0.5) / visible.length : 0;
  // The card sits beside the bar: to its right, or to its left past the middle of the chart.
  const half = visible.length ? 50 / visible.length : 0;
  const align = position > 0.55 ? `calc(-100% - ${half.toFixed(2)}cqw - 8px)` : `calc(${half.toFixed(2)}cqw + 8px)`;

  const ranked = [...workflows]
    .filter((w) => !off[w.category])
    .sort((a, b) => b.credits - a.credits)
    .slice(0, workflowCount);

  const tile = "rounded-xl bg-surface p-3";
  const valueTransition = reduceMotion ? { duration: 0 } : spring.smooth;

  return (
    <section aria-labelledby={`${id}-title`} className={cn("w-full max-w-2xl rounded-2xl border border-border bg-background p-5", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id={`${id}-title`} className="text-sm font-semibold text-foreground">
            {title}
          </h3>
          {days.length ? (
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Cycle {formatDay(days[0].date, false, locale)} – {formatDay(days[days.length - 1].date, false, locale)}
            </p>
          ) : null}
        </div>
        <LayoutGroup id={`${id}-range`}>
          <div role="group" aria-label="Range" className="grid grid-cols-2 gap-0.5 rounded-full bg-surface-2 p-0.5">
            {(["14d", "cycle"] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => pick(r)}
                className={cn(
                  "relative h-8 cursor-pointer rounded-full px-3 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  range === r ? "text-foreground" : "text-[color-mix(in_oklab,var(--muted-foreground)_75%,var(--foreground))]",
                )}
              >
                {range === r ? <motion.span layoutId="credit-trend-range" transition={reduceMotion ? { duration: 0 } : spring.snappy} className="absolute inset-0 rounded-full bg-background shadow-sm" /> : null}
                <span className="relative">{r === "14d" ? "14 days" : "Full cycle"}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className={tile}>
          <p className="text-[12px] text-muted-foreground">Used so far</p>
          <p className="mt-1 font-mono text-lg font-semibold text-foreground">
            <RollingDigits value={usedSoFar} locale={locale} animateOnMount={false} />
          </p>
        </div>
        <div className={tile}>
          <p className="text-[12px] text-muted-foreground">Daily average</p>
          <p className="mt-1 font-mono text-lg font-semibold text-foreground">
            <RollingDigits value={average} locale={locale} animateOnMount={false} />
          </p>
        </div>
        <div className={tile}>
          <p className="flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
            <span>By {renewal ? formatDay(renewal, false, locale) : "renewal"}</span>
            <span
              className={cn(
                "inline-flex h-5 items-center rounded-full px-1.5 text-[11px] font-medium transition-colors",
                onPace ? "bg-success/12 text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]" : "bg-warning/14 text-[color-mix(in_oklab,var(--warning)_65%,var(--foreground))]",
              )}
            >
              {onPace ? "✓ On pace" : "▲ Over pace"}
            </span>
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-foreground">
            <RollingDigits value={projected} locale={locale} animateOnMount={false} />
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative mt-5 [container-type:inline-size]">
        <div
          role="group"
          tabIndex={0}
          aria-label={`Daily credits, ${visible.length} days. Use the left and right arrow keys to read each day.`}
          aria-describedby={`${id}-table`}
          onKeyDown={onChartKey}
          onFocus={() => setActive((i) => i ?? todayIndex - start)}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
          className="relative flex h-44 items-stretch gap-[3px] rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        >
          {visible.map((day, i) => {
            const future = start + i > todayIndex;
            let cumulative = 0;
            return (
              <div key={day.date} className="relative flex-1" onPointerEnter={() => setActive(i)}>
                {active === i ? <span aria-hidden="true" className="absolute inset-0 -mx-px rounded-md bg-foreground/[0.035]" /> : null}
                {future ? (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 bg-foreground/[0.06]"
                    initial={false}
                    animate={{ clipPath: band(0, average / max) }}
                    transition={valueTransition}
                  />
                ) : (
                  cats.map((c, ci) => {
                    const value = off[c.id] ? 0 : (day.values[c.id] ?? 0);
                    const from = cumulative / max;
                    cumulative += value;
                    const dimmed = focusCategory !== null && focusCategory !== c.id;
                    return (
                      <motion.span
                        key={c.id}
                        aria-hidden="true"
                        className="absolute inset-0 transition-opacity duration-200"
                        style={{ background: categoryColor(ci), opacity: dimmed ? 0.25 : 1 }}
                        initial={reduceMotion ? false : { clipPath: band(0, 0) }}
                        animate={{ clipPath: band(from, cumulative / max) }}
                        transition={reduceMotion ? { duration: 0 } : { ...spring.smooth, delay: Math.min(i, 30) * 0.012 }}
                      />
                    );
                  })
                )}
              </div>
            );
          })}
          {/* Daily budget: a full-height layer moved up by a share of its own height. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            initial={false}
            animate={{ y: `${(-(dailyBudget / max) * 100).toFixed(3)}%` }}
            transition={valueTransition}
          >
            <div className="absolute inset-x-0 bottom-0 border-t border-dashed border-foreground/45" />
            <span className="absolute right-0 bottom-1 rounded bg-background/85 px-1 text-[10px] text-muted-foreground">Daily budget {formatCreditsCompact(dailyBudget, locale)}</span>
          </motion.div>
        </div>

        {/* Gliding day card */}
        <AnimatePresence>
          {activeDay ? (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 w-full"
              initial={{ opacity: 0, x: `${(position * 100).toFixed(2)}%` }}
              animate={{ opacity: 1, x: `${(position * 100).toFixed(2)}%` }}
              exit={{ opacity: 0, transition: { duration: duration.instant } }}
              transition={reduceMotion ? { duration: 0 } : { x: spring.snappy, opacity: { duration: duration.quick } }}
            >
              <div className="w-44 rounded-xl border border-border bg-background p-2.5 shadow-lg" style={{ translate: `${align} 0` }}>
                <p className="text-[11px] font-medium text-foreground">
                  {formatDay(activeDay.date, false, locale)}
                  {start + (active ?? 0) === todayIndex ? " · Today" : ""}
                </p>
                {activeFuture ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">Upcoming · about {formatCreditsCompact(average, locale)} at the current pace</p>
                ) : (
                  <>
                    <ul className="mt-1.5 space-y-0.5">
                      {enabled.map((c) => (
                        <li key={c.id} className="flex items-center gap-1.5 text-[11px]">
                          <span className="size-2 rounded-[2px]" style={{ background: categoryColor(cats.indexOf(c)) }} />
                          <span className="flex-1 truncate text-muted-foreground">{c.name}</span>
                          <span className="font-mono text-foreground tabular-nums">{formatCredits(activeDay.values[c.id] ?? 0, locale)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1.5 flex justify-between border-t border-border pt-1.5 text-[11px] font-medium text-foreground">
                      <span>Total</span>
                      <span className="font-mono tabular-nums">{formatCredits(totalOf(activeDay), locale)}</span>
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div aria-hidden="true" className="relative mt-2 flex h-4 justify-between text-[11px] text-muted-foreground">
          <span>{visible[0] ? formatDay(visible[0].date, false, locale) : ""}</span>
          {end - 1 > todayIndex ? (
            <span className="absolute top-0 -translate-x-1/2 font-medium text-foreground" style={{ left: `${(((todayIndex - start + 0.5) / visible.length) * 100).toFixed(2)}%` }}>
              Today
            </span>
          ) : null}
          <span className={cn(end - 1 === todayIndex && "font-medium text-foreground")}>{end - 1 === todayIndex ? "Today" : visible.length ? formatDay(visible[visible.length - 1].date, false, locale) : ""}</span>
        </div>

        <p aria-live="polite" className="sr-only">
          {activeDay ? `${formatDay(activeDay.date, false, locale)}: ${activeFuture ? "upcoming" : `${formatCredits(totalOf(activeDay), locale)} credits`}` : ""}
        </p>
        <table id={`${id}-table`} className="sr-only">
          <caption>Credits per day</caption>
          <tbody>
            {visible.slice(0, Math.max(0, todayIndex - start + 1)).map((d) => (
              <tr key={d.date}>
                <th scope="row">{formatDay(d.date, false, locale)}</th>
                <td>{formatCredits(totalOf(d), locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category toggles double as the legend. */}
      <div role="group" aria-label="Categories" className="mt-4 flex flex-wrap gap-1.5">
        {cats.map((c, ci) => {
          const on = !off[c.id];
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(c.id)}
              onMouseEnter={() => setFocusCategory(c.id)}
              onMouseLeave={() => setFocusCategory(null)}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-border bg-background text-foreground" : "border-dashed border-border bg-transparent text-muted-foreground",
              )}
            >
              <span aria-hidden="true" className="size-2.5 rounded-[3px] transition-opacity" style={{ background: categoryColor(ci), opacity: on ? 1 : 0.3 }} />
              {c.name}
            </button>
          );
        })}
      </div>

      {ranked.length ? (
        <div className="mt-5 border-t border-border pt-4">
          <h4 className="text-[13px] font-semibold text-foreground">Top workflows</h4>
          <ul className="mt-2 divide-y divide-border">
            <AnimatePresence initial={false} mode="popLayout">
              {ranked.map((w) => {
                const ci = cats.findIndex((c) => c.id === w.category);
                const category = cats[ci];
                const change = w.previous ? (w.credits - w.previous) / w.previous : 0;
                const up = change >= 0;
                return (
                  <motion.li
                    key={w.id}
                    layout={reduceMotion ? false : "position"}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: duration.base, ease: ease.out }}
                    onMouseEnter={() => setFocusCategory(w.category)}
                    onMouseLeave={() => setFocusCategory(null)}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">{w.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span aria-hidden="true" className="size-2 rounded-[2px]" style={{ background: categoryColor(Math.max(0, ci)) }} />
                        {category?.name ?? w.category}
                      </p>
                    </div>
                    {w.trend && w.trend.length > 1 ? (
                      <Sparkline data={w.trend} width={72} height={24} area={false} color={categoryColor(Math.max(0, ci))} label={`${w.name} daily credits`} className="hidden sm:block" />
                    ) : null}
                    <div className="w-24 text-right">
                      <p className="font-mono text-[13px] text-foreground tabular-nums">{formatCredits(w.credits, locale)}</p>
                      {w.previous ? (
                        <p className={cn("text-[11px] tabular-nums", up ? "text-[color-mix(in_oklab,var(--warning)_65%,var(--foreground))]" : "text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]")}>
                          {up ? "▲" : "▼"} {Math.abs(change * 100).toFixed(0)}%<span className="sr-only"> vs. last cycle</span>
                        </p>
                      ) : null}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      ) : null}
    </section>
  );
}
