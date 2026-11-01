"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface AreaSeries {
  /** Stable identity across updates. */
  id: string;
  /** Name in the legend and tooltip. */
  label: string;
  /** One value per x label. */
  values: number[];
  /** Line color. Defaults to --chart-1, --chart-2, --chart-3 by position; pass it explicitly if series come and go. */
  color?: string;
}

export interface AreaChartProps
  extends Omit<ComponentProps<"figure">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** X-axis labels, one per point (e.g. dates). */
  labels: string[];
  /** One to three series on a shared value axis. */
  series: AreaSeries[];
  /** Accessible name; also the caption of the screen-reader table. */
  label: string;
  /** Total height in px, including the x-axis labels. @default 240 */
  height?: number;
  /** Formats values on the axis and in the tooltip. */
  formatValue?: (value: number) => string;
  /** Fill a soft wash under each line. @default true */
  area?: boolean;
  /** Smooth monotone curves that never overshoot the data. @default true */
  curved?: boolean;
  /** Most x labels to show. @default 6 */
  maxTicks?: number;
}

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
const X_BAND = 26;
const TOP = 10;
const RIGHT = 8;
const SNAP = { type: "spring", stiffness: 520, damping: 40 } as const;
const full = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const f = (n: number) => Math.round(n * 100) / 100;

function ticksFor(max: number, count = 4) {
  const raw = Math.max(max, 1e-9) / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const n = raw / power;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power;
  const top = Math.max(step, Math.ceil(max / step) * step);
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

/** Monotone cubic curve through the points (or straight segments). */
function linePath(points: [number, number][], curved: boolean) {
  const n = points.length;
  if (n === 0) return "";
  let d = `M${f(points[0][0])},${f(points[0][1])}`;
  if (n === 1) return d;
  if (!curved) return d + points.slice(1).map(([x, y]) => `L${f(x)},${f(y)}`).join("");
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
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    d += `C${f(x0 + h)},${f(y0 + t[i] * h)},${f(x1 - h)},${f(y1 - t[i + 1] * h)},${f(x1)},${f(y1)}`;
  }
  return d;
}

export function AreaChart({
  labels,
  series,
  label,
  height = 240,
  formatValue = (v) => full.format(v),
  area = true,
  curved = true,
  maxTicks = 6,
  className,
  ...props
}: AreaChartProps) {
  const reduceMotion = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const inView = useInView(boxRef, { once: true, amount: 0.35 });
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const hintId = useId();
  const gradientId = useId();

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(() => setWidth(box.clientWidth));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const n = labels.length;
  const colored = series.map((s, i) => ({ ...s, color: s.color ?? COLORS[i % COLORS.length] }));
  const peak = Math.max(0, ...colored.flatMap((s) => s.values));
  const ticks = ticksFor(peak, 4);
  const top = ticks[ticks.length - 1];
  const tickText = (v: number) => (top >= 10_000 ? compact.format(v) : full.format(v));
  const gutter = Math.max(...ticks.map((t) => tickText(t).length)) * 6.6 + 12;
  const plotH = height - X_BAND - TOP;
  const plotW = Math.max(0, width - gutter - RIGHT);
  const x = (i: number) => gutter + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const y = (v: number) => TOP + (1 - v / (top || 1)) * plotH;
  const baseline = TOP + plotH;

  // Evenly stepped x labels, plus the last point when it isn't crowded by the previous label.
  // As many as fit (about one per 64px), never more than maxTicks.
  const fit = Math.max(2, Math.min(maxTicks, Math.floor(plotW / 64)));
  const xStep = n <= fit ? 1 : Math.ceil((n - 1) / (fit - 1));
  const xTicks = Array.from({ length: Math.floor((n - 1) / xStep) + 1 }, (_, j) => j * xStep);
  if (n > 1 && xTicks[xTicks.length - 1] !== n - 1) {
    const room = ((n - 1 - xTicks[xTicks.length - 1]) / (n - 1)) * plotW;
    if (room >= 56) xTicks.push(n - 1);
    else xTicks[xTicks.length - 1] = n - 1;
  }

  const shown = reduceMotion || inView;
  const snap = reduceMotion ? { duration: 0 } : SNAP;

  const indexAt = (clientX: number) => {
    const box = boxRef.current;
    if (!box || n === 0) return null;
    const px = clientX - box.getBoundingClientRect().left;
    return Math.min(n - 1, Math.max(0, Math.round(((px - gutter) / (plotW || 1)) * (n - 1))));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!n) return;
    const step = ({ ArrowRight: 1, ArrowLeft: -1 } as Record<string, number>)[event.key];
    if (step !== undefined) setActive((a) => (a === null ? (step > 0 ? 0 : n - 1) : Math.min(n - 1, Math.max(0, a + step))));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(n - 1);
    else if (event.key === "Escape") setActive(null);
    else return;
    event.preventDefault();
  };

  const readout = active === null ? "" : `${labels[active]}: ${colored.map((s) => `${s.label} ${formatValue(s.values[active] ?? 0)}`).join(", ")}`;
  const px = active === null ? 0 : x(active);
  const flip = px > gutter + plotW / 2;

  return (
    <figure className={cn("w-full", className)} {...props}>
      {colored.length > 1 ? (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {colored.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div
        ref={boxRef}
        tabIndex={0}
        role="group"
        aria-roledescription="area chart"
        aria-label={label}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        onFocus={(event: FocusEvent<HTMLDivElement>) => {
          if (event.currentTarget.matches(":focus-visible")) setActive((a) => a ?? n - 1);
        }}
        onBlur={() => setActive(null)}
        onPointerMove={(event: PointerEvent<HTMLDivElement>) => setActive(indexAt(event.clientX))}
        onPointerLeave={() => setActive(null)}
        className="relative touch-pan-y rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        style={{ height }}
      >
        {width > 0 ? (
          <div aria-hidden="true">
            <svg width={width} height={height} className="absolute inset-0 overflow-visible">
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={gutter} x2={width} y1={Math.round(y(t)) + 0.5} y2={Math.round(y(t)) + 0.5} stroke="var(--border)" />
                  <text x={gutter - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--muted-foreground)" className="tabular-nums">
                    {tickText(t)}
                  </text>
                </g>
              ))}
              {xTicks.map((i, j) => (
                <text
                  key={i}
                  x={x(i)}
                  y={height - 6}
                  textAnchor={j === 0 && n > 1 ? "start" : j === xTicks.length - 1 && n > 1 ? "end" : "middle"}
                  fontSize={11}
                  fill="var(--muted-foreground)"
                >
                  {labels[i]}
                </text>
              ))}
            </svg>

            {/* Lines draw on with a left-to-right clip reveal; data changes morph the paths. */}
            <motion.div
              className="absolute inset-0"
              initial={reduceMotion ? false : { clipPath: `inset(-8px ${width}px -8px -8px)` }}
              animate={shown ? { clipPath: "inset(-8px -8px -8px -8px)" } : undefined}
              transition={{ duration: 1.1, ease: ease.out }}
            >
              <svg width={width} height={height} className="overflow-visible">
                {/* Each wash fades toward the baseline, so overlapping series stay clean instead of muddying. */}
                <defs>
                  {colored.map((s, i) => (
                    <linearGradient key={s.id} id={`${gradientId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.16} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
                    </linearGradient>
                  ))}
                </defs>
                {colored.map((s, si) => {
                  const points = s.values.slice(0, n).map((v, i): [number, number] => [x(i), y(v)]);
                  const d = linePath(points, curved);
                  const fillD = points.length > 1 ? `${d}L${f(points[points.length - 1][0])},${f(baseline)}L${f(points[0][0])},${f(baseline)}Z` : "";
                  return (
                    <g key={s.id}>
                      {area && fillD ? (
                        <motion.path initial={false} animate={{ d: fillD }} transition={{ duration: 0.5, ease: ease.out }} fill={`url(#${gradientId}-${si})`} />
                      ) : null}
                      <motion.path
                        initial={false}
                        animate={{ d }}
                        transition={{ duration: 0.5, ease: ease.out }}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })}
              </svg>
            </motion.div>

            {active !== null ? (
              <>
                <svg width={width} height={height} className="pointer-events-none absolute inset-0 overflow-visible">
                  {/* The crosshair snaps between x positions with transforms only. */}
                  <motion.g initial={{ x: px }} animate={{ x: px }} transition={snap}>
                    <line x1={0} x2={0} y1={TOP} y2={baseline} stroke="var(--muted-foreground)" strokeOpacity={0.45} />
                    {colored.map((s) => (
                      <motion.circle
                        key={s.id}
                        r={4}
                        fill={s.color}
                        stroke="var(--background)"
                        strokeWidth={2}
                        initial={{ y: y(s.values[active] ?? 0) }}
                        animate={{ y: y(s.values[active] ?? 0) }}
                        transition={snap}
                      />
                    ))}
                  </motion.g>
                </svg>
                <motion.div
                  className={cn(
                    "pointer-events-none absolute top-1 left-0 z-10 min-w-32 rounded-md border border-border bg-popover px-2.5 py-2 text-xs shadow-md",
                    flip && "-translate-x-full",
                  )}
                  initial={{ x: flip ? px - 12 : px + 12 }}
                  animate={{ x: flip ? px - 12 : px + 12 }}
                  transition={snap}
                >
                  <div className="mb-1 text-muted-foreground">{labels[active]}</div>
                  <ul className="space-y-0.5">
                    {colored.map((s) => (
                      <li key={s.id} className="flex items-center gap-2">
                        <span className="h-0.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                        <span className="font-semibold text-foreground tabular-nums">{formatValue(s.values[active] ?? 0)}</span>
                        <span className="text-muted-foreground">{s.label}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <p id={hintId} className="sr-only">
        Use the left and right arrow keys to read each point.
      </p>
      <p aria-live="polite" className="sr-only">
        {readout}
      </p>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            {colored.map((s) => (
              <th key={s.id} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={`${l}-${i}`}>
              <th scope="row">{l}</th>
              {colored.map((s) => (
                <td key={s.id}>{formatValue(s.values[i] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
