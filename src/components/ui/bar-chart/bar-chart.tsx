"use client";

import { useId, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface BarDatum {
  /** Stable identity across updates; defaults to the label. */
  id?: string;
  /** Category name. */
  label: string;
  /** Value; bars start at zero. */
  value: number;
}

export interface BarChartProps
  extends Omit<ComponentProps<"figure">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** One bar per item. */
  data: BarDatum[];
  /** Accessible name; also the caption of the screen-reader table. */
  label: string;
  /** Columns rising from a baseline, or ranked bars reading left to right. @default "vertical" */
  orientation?: "vertical" | "horizontal";
  /** Sort by value; bars glide to their new place when the data changes. @default "none" */
  sort?: "none" | "ascending" | "descending";
  /** Bar color. @default "var(--chart-1)" */
  color?: string;
  /** Id (or label) of one bar to emphasize; the others turn neutral. */
  highlight?: string;
  /** Plot height in px, for vertical bars. @default 220 */
  height?: number;
  /** Top of the value axis. Defaults to the maximum, rounded up to a clean tick. */
  max?: number;
  /** Formats values in labels and tooltips. */
  formatValue?: (value: number) => string;
}

const SPRING = { type: "spring", stiffness: 170, damping: 24, mass: 0.9 } as const;
const NEUTRAL = "color-mix(in oklab, var(--muted-foreground) 30%, var(--background))";
const full = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Clean axis ticks from zero: steps of 1, 2, 2.5 or 5 × 10ⁿ. */
function ticksFor(max: number, count = 4) {
  const raw = Math.max(max, 1e-9) / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const n = raw / power;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power;
  const top = Math.max(step, Math.ceil(max / step) * step);
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

export function BarChart({
  data,
  label,
  orientation = "vertical",
  sort = "none",
  color = "var(--chart-1)",
  highlight,
  height = 220,
  max,
  formatValue = (v) => full.format(v),
  className,
  ...props
}: BarChartProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const [active, setActive] = useState<number | null>(null);
  const hintId = useId();

  const rows = data.map((d) => ({ ...d, key: d.id ?? d.label }));
  if (sort !== "none") rows.sort((a, b) => (sort === "ascending" ? a.value - b.value : b.value - a.value));
  const peak = Math.max(0, ...rows.map((r) => r.value));
  const ticks = ticksFor(max ?? peak, 4);
  const top = max ?? ticks[ticks.length - 1];
  // One tick style per axis: compact once the axis reaches 10,000.
  const tickText = (v: number) => (top >= 10_000 ? compact.format(v) : full.format(v));
  const pct = (v: number) => Math.max(0, Math.min(1, v / (top || 1))) * 100;
  const shown = reduceMotion || inView;
  const fill = (key: string, rowLabel: string) => (highlight === undefined || highlight === key || highlight === rowLabel ? color : NEUTRAL);
  const current = active === null ? null : rows[active];
  const bar = (i: number) => (reduceMotion ? { duration: 0 } : { ...SPRING, delay: i * 0.035 });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const n = rows.length;
    if (!n) return;
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[event.key];
    if (step !== undefined) setActive((a) => (a === null ? (step > 0 ? 0 : n - 1) : (a + step + n) % n));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(n - 1);
    else if (event.key === "Escape") setActive(null);
    else return;
    event.preventDefault();
  };

  const focusProps = {
    tabIndex: 0,
    role: "group",
    "aria-roledescription": "bar chart",
    "aria-label": label,
    "aria-describedby": hintId,
    onKeyDown,
    onFocus: (event: FocusEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && event.currentTarget.matches(":focus-visible")) setActive((a) => a ?? 0);
    },
    onBlur: () => setActive(null),
    onPointerLeave: () => setActive(null),
  };

  return (
    <figure className={cn("@container w-full", className)} {...props}>
      {orientation === "vertical" ? (
        <div ref={ref} {...focusProps} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4">
          <div aria-hidden="true">
            <div className="flex" style={{ height }}>
              <div className="relative mr-2 w-10 shrink-0 text-[11px] text-muted-foreground tabular-nums">
                {ticks.map((t) => (
                  <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${pct(t)}%` }}>
                    {tickText(t)}
                  </span>
                ))}
              </div>
              <div className="relative flex-1">
                {ticks.map((t) => (
                  <div key={t} className="absolute inset-x-0 h-px bg-border" style={{ bottom: `${pct(t)}%` }} />
                ))}
                <div className="absolute inset-0 flex">
                  {rows.map((row, i) => (
                    // The whole column is the hit target, not just the painted bar.
                    <motion.div
                      key={row.key}
                      layout={!reduceMotion}
                      transition={SPRING}
                      className="relative flex h-full flex-1 justify-center"
                      onPointerEnter={() => setActive(i)}
                    >
                      <motion.div
                        className="absolute bottom-0 h-full w-3/5 max-w-6"
                        style={{ background: fill(row.key, row.label) }}
                        initial={{ clipPath: "inset(100% 0% 0% 0% round 4px 4px 0px 0px)" }}
                        animate={{
                          clipPath: `inset(${shown ? 100 - pct(row.value) : 100}% 0% 0% 0% round 4px 4px 0px 0px)`,
                          opacity: active === null || active === i ? 1 : 0.55,
                        }}
                        transition={{ clipPath: bar(i), opacity: { duration: 0.15 } }}
                      />
                    </motion.div>
                  ))}
                </div>
                {current && active !== null ? (
                  <div
                    className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
                    style={{
                      left: `clamp(3rem, ${((active + 0.5) / rows.length) * 100}%, calc(100% - 3rem))`,
                      bottom: `min(calc(${pct(current.value)}% + 8px), calc(100% - 2.75rem))`,
                    }}
                  >
                    <div className="font-semibold text-foreground tabular-nums">{formatValue(current.value)}</div>
                    <div className="text-muted-foreground">{current.label}</div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-2 flex pl-12">
              {rows.map((row, i) => (
                <motion.span
                  key={row.key}
                  layout={!reduceMotion}
                  transition={SPRING}
                  className={cn(
                    "flex min-w-0 flex-1 justify-center px-0.5 text-[11px]",
                    active === i ? "text-foreground" : "text-muted-foreground",
                    // Many bars in a narrow chart: label every other one, letting it use its hidden neighbours' room.
                    rows.length > 8 && active !== i && "@max-md:even:invisible",
                  )}
                >
                  <span className={cn("min-w-0 truncate", rows.length > 8 && "@max-md:shrink-0 @max-md:overflow-visible")}>{row.label}</span>
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div ref={ref} {...focusProps} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4">
          {/* Every bar carries its value at the tip, so no value axis is needed. */}
          <ul aria-hidden="true" className="space-y-1.5">
            {rows.map((row, i) => (
              <motion.li
                key={row.key}
                layout={!reduceMotion}
                transition={SPRING}
                className="grid h-8 grid-cols-[minmax(4rem,32%)_1fr] items-center gap-3"
                onPointerEnter={() => setActive(i)}
              >
                <span className={cn("truncate text-sm transition-colors", active === i ? "text-foreground" : "text-muted-foreground")}>
                  {row.label}
                </span>
                <span className="relative h-5 overflow-hidden">
                  <span className="absolute inset-y-0 right-14 left-0">
                    <motion.span
                      className="absolute inset-0"
                      style={{ background: fill(row.key, row.label) }}
                      initial={{ clipPath: "inset(0% 100% 0% 0% round 0px 4px 4px 0px)" }}
                      animate={{
                        clipPath: `inset(0% ${shown ? 100 - pct(row.value) : 100}% 0% 0% round 0px 4px 4px 0px)`,
                        opacity: active === null || active === i ? 1 : 0.55,
                      }}
                      transition={{ clipPath: bar(i), opacity: { duration: 0.15 } }}
                    />
                    {/* The value rides the bar's tip with the same spring. */}
                    <motion.span
                      className="absolute inset-y-0 left-0 flex w-full items-center"
                      initial={{ x: "0%" }}
                      animate={{ x: `${shown ? pct(row.value) : 0}%` }}
                      transition={bar(i)}
                    >
                      <span className="pl-2 text-xs font-medium text-foreground tabular-nums">{formatValue(row.value)}</span>
                    </motion.span>
                  </span>
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
      <p id={hintId} className="sr-only">
        Use the arrow keys to read each bar.
      </p>
      <p aria-live="polite" className="sr-only">
        {current ? `${current.label}: ${formatValue(current.value)}` : ""}
      </p>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td>{formatValue(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
