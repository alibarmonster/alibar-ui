"use client";

import { useEffect, useRef, useState, type ComponentProps, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface StatCardProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** What the number measures, in sentence case. */
  label: string;
  /** Current value. Changes count from the old value to the new one. */
  value: number;
  /** Value for the previous period; the delta is computed from it. */
  previous?: number;
  /** Names the comparison period after the delta. @default "vs last period" */
  comparison?: string;
  /** Recent values, oldest first (about 12). The current period is drawn in the accent. */
  trend?: number[];
  /** One label per trend point, shown on hover. */
  trendLabels?: string[];
  /** Which direction is good, for the delta color. @default "up" */
  goodDirection?: "up" | "down";
  /** Formats the value. @default full under 10,000, compact above (12.9K, 4.2M) */
  formatValue?: (value: number) => string;
  /** Small icon beside the label. */
  icon?: ReactNode;
}

const TREND_H = 44;
const PAD = 6;
const full = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const autoFormat = (v: number) => (Math.abs(v) >= 10_000 ? compact.format(v) : full.format(v));
const f = (n: number) => Math.round(n * 100) / 100;

/** Monotone cubic segments through the points: smooth, never overshooting. */
function segments(points: [number, number][]) {
  const n = points.length;
  if (n < 2) return [];
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1][0] - points[i][0]);
    m.push((points[i + 1][1] - points[i][1]) / dx[i]);
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
  }
  t.push(m[n - 2]);
  return points.slice(0, -1).map(([x0, y0], i) => {
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    return `C${f(x0 + h)},${f(y0 + t[i] * h)},${f(x1 - h)},${f(y1 - t[i + 1] * h)},${f(x1)},${f(y1)}`;
  });
}

export function StatCard({
  label,
  value,
  previous,
  comparison = "vs last period",
  trend,
  trendLabels,
  goodDirection = "up",
  formatValue = autoFormat,
  icon,
  className,
  ...props
}: StatCardProps) {
  const reduceMotion = useReducedMotion();
  const trendRef = useRef<HTMLDivElement>(null);
  const inView = useInView(trendRef, { once: true, amount: 0.5 });
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  // The value counts from the old number to the new one; the first render shows it as is.
  const shownValue = useMotionValue(value);
  const text = useTransform(shownValue, (v) => formatValue(v));
  useEffect(() => {
    if (reduceMotion) {
      shownValue.set(value);
      return;
    }
    const controls = animate(shownValue, value, { duration: 0.8, ease: ease.out });
    return () => controls.stop();
  }, [value, reduceMotion, shownValue]);

  useEffect(() => {
    const el = trendRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const change = previous === undefined || previous === 0 ? null : ((value - previous) / Math.abs(previous)) * 100;
  const direction = change === null || Math.abs(change) < 0.05 ? 0 : change > 0 ? 1 : -1;
  const good = direction === 0 ? null : (direction > 0) === (goodDirection === "up");
  const changeText = change === null ? "" : `${direction > 0 ? "+" : direction < 0 ? "−" : ""}${Math.abs(change).toFixed(1)}%`;
  const DeltaIcon = direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus;

  const data = trend ?? [];
  const min = Math.min(...data);
  const span = Math.max(...data) - min || 1;
  const step = data.length > 1 ? (width - PAD * 2) / (data.length - 1) : 0;
  const points = data.map((v, i): [number, number] => [PAD + i * step, PAD + (1 - (v - min) / span) * (TREND_H - PAD * 2)]);
  const segs = segments(points);
  const line = points.length > 1 ? `M${f(points[0][0])},${f(points[0][1])}${segs.join("")}` : "";
  const lastSegment = points.length > 1 ? `M${f(points[points.length - 2][0])},${f(points[points.length - 2][1])}${segs[segs.length - 1]}` : "";
  const end = points[points.length - 1];

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (data.length < 2) return;
    const x = event.clientX - event.currentTarget.getBoundingClientRect().left;
    setHover(Math.min(data.length - 1, Math.max(0, Math.round((x - PAD) / (step || 1)))));
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs", className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon ? <span className="text-muted-foreground [&_svg]:size-4">{icon}</span> : null}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">
        <span className="sr-only">{formatValue(value)}</span>
        <motion.span aria-hidden="true">{text}</motion.span>
      </div>
      {change !== null ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={changeText}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 4, filter: reduceMotion ? "blur(0px)" : "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: { duration: duration.instant } }}
              transition={{ duration: duration.base, ease: ease.out }}
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular-nums",
                good === null ? "bg-muted text-foreground/65" : good ? "bg-success/10 text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]" : "bg-destructive/10 text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]",
              )}
            >
              <DeltaIcon className="size-3.5" aria-hidden="true" />
              <span className="sr-only">{direction > 0 ? "Up" : direction < 0 ? "Down" : "No change,"} </span>
              {changeText}
            </motion.span>
          </AnimatePresence>
          <span className="text-muted-foreground">{comparison}</span>
        </div>
      ) : null}
      {data.length > 1 ? (
        <div
          ref={trendRef}
          className="relative mt-4"
          style={{ height: TREND_H }}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          <span className="sr-only">
            Trend over {data.length} periods, low {formatValue(min)}, high {formatValue(min + span)}
          </span>
          {width > 0 ? (
            <>
              <motion.svg
                width={width}
                height={TREND_H}
                className="absolute inset-0 overflow-visible"
                aria-hidden="true"
                initial={reduceMotion ? false : { clipPath: `inset(-6px ${width + 6}px -6px -6px)` }}
                animate={inView || reduceMotion ? { clipPath: "inset(-6px -8px -6px -6px)" } : undefined}
                transition={{ duration: 0.9, ease: ease.out }}
              >
                {/* Earlier periods in the de-emphasis gray; only the current period wears the accent. */}
                <motion.path
                  initial={false}
                  animate={{ d: line }}
                  transition={{ duration: 0.5, ease: ease.out }}
                  fill="none"
                  stroke="color-mix(in oklab, var(--muted-foreground) 40%, var(--background))"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <motion.path
                  initial={false}
                  animate={{ d: lastSegment }}
                  transition={{ duration: 0.5, ease: ease.out }}
                  fill="none"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                <motion.circle
                  r={4}
                  fill="var(--chart-1)"
                  stroke="var(--card)"
                  strokeWidth={2}
                  initial={false}
                  animate={{ cx: end[0], cy: end[1] }}
                  transition={{ duration: 0.5, ease: ease.out }}
                />
                {hover !== null ? (
                  <circle
                    cx={points[hover][0]}
                    cy={points[hover][1]}
                    r={4}
                    fill={hover === data.length - 1 ? "var(--chart-1)" : "var(--muted-foreground)"}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ) : null}
              </motion.svg>
              {hover !== null ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-full z-10 mb-1 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[11px] whitespace-nowrap text-background shadow-md"
                  style={{ left: Math.min(Math.max(points[hover][0], 36), width - 36) }}
                >
                  <span className="font-semibold">{formatValue(data[hover])}</span>
                  {trendLabels?.[hover] ? <span className="ml-1 text-background/65">{trendLabels[hover]}</span> : null}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
