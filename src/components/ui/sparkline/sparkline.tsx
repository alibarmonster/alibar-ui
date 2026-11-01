"use client";

import { useRef, useState, type ComponentProps, type PointerEvent } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface SparklineProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Values, oldest first. */
  data: number[];
  /** One label per point (e.g. dates), shown on hover. */
  labels?: string[];
  /** What the line measures; starts the accessible summary. @default "Trend" */
  label?: string;
  /** Width in px. @default 120 */
  width?: number;
  /** Height in px. @default 36 */
  height?: number;
  /** Line color. @default "var(--chart-1)" */
  color?: string;
  /** Fill a soft wash under the line. @default true */
  area?: boolean;
  /** Show the change from the first to the last value as a badge. @default false */
  showChange?: boolean;
  /** Which direction counts as good, for the badge color. @default "up" */
  goodDirection?: "up" | "down";
  /** Formats values on hover and in the accessible summary. */
  formatValue?: (value: number) => string;
  /** Draw the line on the first time it scrolls into view. @default true */
  drawOn?: boolean;
}

const PAD = 6; // room for the end dot (r 4) and its 2px ring
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const f = (n: number) => Math.round(n * 100) / 100;

/** Monotone cubic curve: smooth, and never overshoots the data between points. */
function monotone(points: [number, number][]) {
  const n = points.length;
  if (n < 2) return n ? `M${f(points[0][0])},${f(points[0][1])}` : "";
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
  let d = `M${f(points[0][0])},${f(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    d += `C${f(x0 + h)},${f(y0 + t[i] * h)},${f(x1 - h)},${f(y1 - t[i + 1] * h)},${f(x1)},${f(y1)}`;
  }
  return d;
}

export function Sparkline({
  data,
  labels,
  label = "Trend",
  width = 120,
  height = 36,
  color = "var(--chart-1)",
  area = true,
  showChange = false,
  goodDirection = "up",
  formatValue = (v) => number.format(v),
  drawOn = true,
  className,
  ...props
}: SparklineProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [active, setActive] = useState<number | null>(null);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = data.length > 1 ? (width - PAD * 2) / (data.length - 1) : 0;
  const points = data.map((v, i): [number, number] => [PAD + i * step, PAD + (1 - (v - min) / span) * (height - PAD * 2)]);
  const line = monotone(points);
  const last = points[points.length - 1];

  const first = data[0] ?? 0;
  const end = data[data.length - 1] ?? 0;
  const change = first === 0 ? 0 : ((end - first) / Math.abs(first)) * 100;
  const good = change === 0 ? null : (change > 0) === (goodDirection === "up");
  const changeText = `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  const summary = data.length
    ? `${label}: ${formatValue(first)} to ${formatValue(end)}${first ? ` (${changeText})` : ""}, low ${formatValue(min)}, high ${formatValue(max)}`
    : `${label}: no data`;

  const shown = !drawOn || reduceMotion || inView;

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!data.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    setActive(Math.min(data.length - 1, Math.max(0, Math.round((x - PAD) / (step || 1)))));
  };

  const point = active === null ? null : points[active];

  return (
    <div className={cn("inline-flex items-center gap-2", className)} {...props}>
      <div
        ref={ref}
        role="img"
        aria-label={summary}
        className="relative shrink-0"
        style={{ width, height }}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActive(null)}
      >
        {/* Draw-on is a left-to-right clip-path reveal of line and wash together. */}
        <motion.div
          className="absolute inset-0"
          initial={drawOn && !reduceMotion ? { clipPath: `inset(-2px ${width + 2}px -2px -2px)` } : false}
          animate={shown ? { clipPath: "inset(-2px -8px -2px -2px)" } : undefined}
          transition={{ duration: 0.9, ease: ease.out }}
        >
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
            {area && points.length > 1 ? (
              <path d={`${line}L${f(last[0])},${height}L${f(points[0][0])},${height}Z`} fill={color} fillOpacity={0.1} />
            ) : null}
            <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
        {last ? (
          <svg width={width} height={height} className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
            <motion.circle
              cx={last[0]}
              cy={last[1]}
              r={4}
              fill={color}
              stroke="var(--background)"
              strokeWidth={2}
              initial={drawOn && !reduceMotion ? { scale: 0 } : false}
              animate={shown ? { scale: active === null ? 1 : 0.6 } : undefined}
              transition={{ type: "spring", stiffness: 500, damping: 26, delay: active === null && drawOn ? 0.75 : 0 }}
            />
            {point ? <circle cx={point[0]} cy={point[1]} r={4} fill={color} stroke="var(--background)" strokeWidth={2} /> : null}
          </svg>
        ) : null}
        {point && active !== null ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full z-10 mb-1.5 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[11px] whitespace-nowrap text-background shadow-md"
            style={{ left: Math.min(Math.max(point[0], 24), width - 24) }}
          >
            <span className="font-semibold tabular-nums">{formatValue(data[active])}</span>
            {labels?.[active] ? <span className="ml-1 text-background/65">{labels[active]}</span> : null}
          </div>
        ) : null}
      </div>
      {showChange && data.length > 1 ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
            good === null ? "bg-muted text-foreground/65" : good ? "bg-success/10 text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]" : "bg-destructive/10 text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]",
          )}
        >
          {change >= 0 ? <TrendingUp className="size-3" aria-hidden="true" /> : <TrendingDown className="size-3" aria-hidden="true" />}
          <span className="sr-only">{change >= 0 ? "Up" : "Down"} </span>
          {changeText.replace("-", "−")}
        </span>
      ) : null}
    </div>
  );
}
