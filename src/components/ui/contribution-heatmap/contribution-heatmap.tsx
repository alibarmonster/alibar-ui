"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface HeatmapDay {
  /** Day in YYYY-MM-DD form. */
  date: string;
  /** Activity on that day. */
  count: number;
}

export interface ContributionHeatmapProps
  extends Omit<ComponentProps<"figure">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Daily counts; missing days count as zero. */
  data: HeatmapDay[];
  /** Last day shown (YYYY-MM-DD). Defaults to the latest date in `data`. */
  endDate?: string;
  /** Number of weeks shown. @default 26 */
  weeks?: number;
  /** Upper bounds of levels 1–3; anything above is level 4. Defaults to quartiles of the non-zero days. */
  thresholds?: [number, number, number];
  /** Accessible name and summary noun. @default "Contributions" */
  label?: string;
  /** Singular and plural unit for tooltips. @default ["contribution", "contributions"] */
  unit?: [string, string];
  /** First day of the week: 0 for Sunday, 1 for Monday. @default 0 */
  weekStart?: 0 | 1;
  /** Cell size in px. @default 12 */
  cellSize?: number;
}

// One hue, light to dark (every filled step clears 2:1 on white); an empty day is a neutral fill.
const LEVELS = [
  "var(--muted)",
  "color-mix(in oklab, var(--chart-1) 50%, var(--background))",
  "color-mix(in oklab, var(--chart-1) 67%, var(--background))",
  "color-mix(in oklab, var(--chart-1) 84%, var(--background))",
  "var(--chart-1)",
];
const GAP = 3;
const LABEL_W = 30;
const MONTH_H = 18;
const DAY = 86_400_000;
const longDate = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const number = new Intl.NumberFormat("en-US");
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parse = (s: string) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));

type Cell = { t: number; date: string; count: number; level: number } | null;

export function ContributionHeatmap({
  data,
  endDate,
  weeks = 26,
  thresholds,
  label = "Contributions",
  unit = ["contribution", "contributions"],
  weekStart = 0,
  cellSize = 12,
  className,
  ...props
}: ContributionHeatmapProps) {
  const reduceMotion = useReducedMotion();
  const figureRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(scrollRef, { once: true, amount: 0.3 });
  const [active, setActive] = useState<{ w: number; r: number; x: number; y: number } | null>(null);
  const hintId = useId();

  // Dates are handled in UTC throughout, so server and client agree on every cell.
  const counts = new Map(data.map((d) => [d.date, d.count]));
  const end = endDate ? parse(endDate) : data.length ? Math.max(...data.map((d) => parse(d.date))) : Date.UTC(2026, 0, 1);
  const endRow = (new Date(end).getUTCDay() - weekStart + 7) % 7;
  const start = end - ((weeks - 1) * 7 + endRow) * DAY;

  const windowCounts: number[] = [];
  for (let t = start; t <= end; t += DAY) windowCounts.push(counts.get(new Date(t).toISOString().slice(0, 10)) ?? 0);
  const nonZero = windowCounts.filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p: number) => nonZero[Math.floor(p * (nonZero.length - 1))] ?? 0;
  const [t1, t2, t3] = thresholds ?? [q(0.25), q(0.5), q(0.75)];
  const levelOf = (c: number) => (c <= 0 ? 0 : c <= t1 ? 1 : c <= t2 ? 2 : c <= t3 ? 3 : 4);
  const total = windowCounts.reduce((sum, c) => sum + c, 0);

  const columns: Cell[][] = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, r) => {
      const t = start + (w * 7 + r) * DAY;
      if (t > end) return null;
      const date = new Date(t).toISOString().slice(0, 10);
      const count = counts.get(date) ?? 0;
      return { t, date, count, level: levelOf(count) };
    }),
  );

  // A month label where a new month starts, skipped when it would crowd the previous one.
  const months: { w: number; text: string }[] = [];
  columns.forEach((column, w) => {
    const first = column.find(Boolean);
    if (!first) return;
    const m = new Date(first.t).getUTCMonth();
    const previous = w > 0 ? columns[w - 1].find(Boolean) : null;
    if (w === 0 || (previous && new Date(previous.t).getUTCMonth() !== m)) {
      if (!months.length || w - months[months.length - 1].w >= 3) months.push({ w, text: monthName.format(first.t) });
    }
  });

  const monthTotals = new Map<string, number>();
  for (const column of columns)
    for (const cell of column) if (cell) monthTotals.set(monthYear.format(cell.t), (monthTotals.get(monthYear.format(cell.t)) ?? 0) + cell.count);

  // Start scrolled to the latest weeks on narrow screens.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  const describe = (cell: NonNullable<Cell>) => `${number.format(cell.count)} ${cell.count === 1 ? unit[0] : unit[1]} on ${longDate.format(cell.t)}`;

  const activate = (w: number, r: number) => {
    const scroll = scrollRef.current;
    const figure = figureRef.current;
    if (!scroll || !figure || !columns[w]?.[r]) return;
    const step = cellSize + GAP;
    const box = scroll.getBoundingClientRect();
    const origin = figure.getBoundingClientRect();
    setActive({
      w,
      r,
      x: box.left - origin.left + LABEL_W + GAP + w * step + cellSize / 2 - scroll.scrollLeft,
      y: box.top - origin.top + MONTH_H + GAP + r * step,
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const move = moves[event.key];
    if (event.key === "Escape") return setActive(null);
    if (!move) return;
    event.preventDefault();
    const from = active ?? { w: weeks - 1, r: endRow };
    let w = Math.min(weeks - 1, Math.max(0, from.w + (active ? move[0] : 0)));
    let r = Math.min(6, Math.max(0, from.r + (active ? move[1] : 0)));
    if (!columns[w][r]) {
      w = weeks - 1;
      r = endRow;
    }
    const scroll = scrollRef.current;
    if (scroll) {
      const left = LABEL_W + GAP + w * (cellSize + GAP);
      if (left < scroll.scrollLeft + LABEL_W) scroll.scrollLeft = left - LABEL_W - GAP;
      else if (left + cellSize > scroll.scrollLeft + scroll.clientWidth) scroll.scrollLeft = left + cellSize - scroll.clientWidth + GAP;
    }
    activate(w, r);
  };

  const cell = active ? columns[active.w][active.r] : null;
  const weekdayRows = weekStart === 0 ? [1, 3, 5] : [0, 2, 4];

  return (
    <figure ref={figureRef} className={cn("relative w-full max-w-full", className)} {...props}>
      <div
        ref={scrollRef}
        tabIndex={0}
        role="group"
        aria-roledescription="heatmap"
        aria-label={`${label}: ${number.format(total)} in the last ${weeks} weeks`}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        onFocus={(event: FocusEvent<HTMLDivElement>) => {
          if (event.currentTarget.matches(":focus-visible") && !active) activate(weeks - 1, endRow);
        }}
        onBlur={() => setActive(null)}
        onScroll={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className="overflow-x-auto rounded-md pb-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div
          aria-hidden="true"
          className="grid w-max"
          style={{
            gridTemplateColumns: `${LABEL_W}px repeat(${weeks}, ${cellSize}px)`,
            gridTemplateRows: `${MONTH_H}px repeat(7, ${cellSize}px)`,
            gap: GAP,
          }}
        >
          {months.map((m) => (
            <span key={m.w} className="text-[11px] leading-none whitespace-nowrap text-muted-foreground" style={{ gridColumn: m.w + 2, gridRow: 1 }}>
              {m.text}
            </span>
          ))}
          {/* Weekday labels stay pinned while the weeks scroll underneath. */}
          <span
            className="sticky left-0 z-[1] grid bg-background text-[11px] leading-none text-muted-foreground"
            style={{ gridColumn: 1, gridRow: "1 / span 8", gridTemplateRows: `${MONTH_H}px repeat(7, ${cellSize}px)`, gap: GAP, marginRight: -GAP, paddingRight: GAP }}
          >
            {weekdayRows.map((r) => (
              <span key={r} className="self-center" style={{ gridRow: r + 2 }}>
                {WEEKDAYS[(r + weekStart) % 7]}
              </span>
            ))}
          </span>
          {columns.map((column, w) =>
            column.map((day, r) =>
              day ? (
                <motion.span
                  key={day.date}
                  onPointerEnter={() => activate(w, r)}
                  className={cn(
                    "rounded-[3px]",
                    active?.w === w && active.r === r && "ring-2 ring-foreground/70 ring-offset-1 ring-offset-background",
                  )}
                  style={{ gridColumn: w + 2, gridRow: r + 2, background: LEVELS[day.level] }}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                  animate={inView || reduceMotion ? { opacity: 1, scale: 1 } : undefined}
                  transition={
                    reduceMotion
                      ? { duration: 0.2 }
                      : { type: "spring", stiffness: 380, damping: 26, delay: Math.min(0.6, w * 0.016 + r * 0.025) }
                  }
                />
              ) : null,
            ),
          )}
        </div>
      </div>

      {cell && active ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md"
          style={{ left: active.x, top: active.y - 6 }}
        >
          <span className="font-semibold">{number.format(cell.count)}</span> {cell.count === 1 ? unit[0] : unit[1]}
          <span className="text-background/65"> · {longDate.format(cell.t)}</span>
        </div>
      ) : null}

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{number.format(total)}</span> {unit[1]} in the last {weeks} weeks
        </span>
        <span className="flex items-center gap-1" aria-hidden="true">
          Less
          {LEVELS.map((color, i) => (
            <span key={i} className="size-[11px] rounded-[3px]" style={{ background: color }} />
          ))}
          More
        </span>
      </figcaption>

      <p id={hintId} className="sr-only">
        Use the arrow keys to move between days.
      </p>
      <p aria-live="polite" className="sr-only">
        {cell ? describe(cell) : ""}
      </p>
      <table className="sr-only">
        <caption>{label} by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {[...monthTotals].map(([month, sum]) => (
            <tr key={month}>
              <th scope="row">{month}</th>
              <td>{number.format(sum)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
