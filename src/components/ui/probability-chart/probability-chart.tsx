"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatProbability } from "@/lib/markets/format";
import type { Market } from "@/lib/markets/types";
import { useHydrated } from "@/lib/markets/use-now";

export type ChartTimeframe = "1H" | "6H" | "1D" | "1W" | "1M" | "ALL";

export interface ChartAnnotation {
  /** Timestamp, ms. */
  t: number;
  /** Short label, e.g. "News: launch delayed". */
  label: string;
}

export interface ProbabilityChartProps {
  /** Market with `history` (prices per outcome in basis points). */
  market: Market;
  /** Initial timeframe. @default "1W" */
  defaultTimeframe?: ChartTimeframe;
  /** Event dots on the first line, with a hover card. */
  annotations?: ChartAnnotation[];
  /** Plot height in px. @default 220 */
  height?: number;
  /** Classes for the root. */
  className?: string;
}

const FRAMES: { id: ChartTimeframe; ms: number }[] = [
  { id: "1H", ms: 3600_000 },
  { id: "6H", ms: 6 * 3600_000 },
  { id: "1D", ms: 86400_000 },
  { id: "1W", ms: 7 * 86400_000 },
  { id: "1M", ms: 30 * 86400_000 },
  { id: "ALL", ms: Infinity },
];
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const POINTS = 48;
const PAD = { top: 10, right: 44, bottom: 22, left: 8 };

const timeFormat = (span: number) =>
  new Intl.DateTimeFormat("en-US", span <= 86400_000 ? { hour: "numeric", minute: "2-digit", timeZone: "UTC" } : { month: "short", day: "numeric", timeZone: "UTC" });

/** Resamples history to POINTS evenly spaced points in [start, end] so paths can morph between timeframes. */
function resample(history: NonNullable<Market["history"]>, series: number, start: number, end: number) {
  const out: { t: number; values: number[] }[] = [];
  for (let i = 0; i < POINTS; i++) {
    const t = start + ((end - start) * i) / (POINTS - 1);
    let k = history.findIndex((point) => point.t >= t);
    if (k <= 0) k = Math.max(1, k === -1 ? history.length - 1 : 1);
    const a = history[k - 1];
    const b = history[k];
    const f = b.t === a.t ? 1 : Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
    out.push({ t, values: Array.from({ length: series }, (_, s) => Math.round(a.prices[s] + (b.prices[s] - a.prices[s]) * f)) });
  }
  return out;
}

/**
 * Probability over time, one line per outcome, with timeframe tabs that morph the lines, a legend that
 * toggles them, a snapping crosshair, live ticks and optional event annotations.
 */
export function ProbabilityChart({ market, defaultTimeframe = "1W", annotations = [], height = 220, className }: ProbabilityChartProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const [width, setWidth] = useState(600);
  const [frame, setFrame] = useState<ChartTimeframe>(defaultTimeframe);
  const [hidden, setHidden] = useState<Record<number, boolean>>({});
  const [active, setActive] = useState<number | null>(null);
  const [note, setNote] = useState<number | null>(null);
  const series = Math.min(market.type === "binary" ? 1 : market.outcomes.length, COLORS.length);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const history = useMemo(() => market.history ?? [], [market.history]);
  const end = history.length ? history[history.length - 1].t : 0;
  const span = FRAMES.find((f) => f.id === frame)!.ms;
  const start = history.length ? Math.max(history[0].t, span === Infinity ? history[0].t : end - span) : 0;
  const points = useMemo(() => (history.length > 1 ? resample(history, series, start, end) : []), [history, series, start, end]);
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (POINTS - 1)) * plotW;
  const y = (bps: number) => PAD.top + (1 - bps / 10000) * plotH;
  const fmt = timeFormat(end - start);
  const path = (s: number) => points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.values[s]).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const shown = active !== null ? points[active] : null;

  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const i = Math.round(((event.clientX - rect.left - PAD.left) / plotW) * (POINTS - 1));
    setActive(Math.min(POINTS - 1, Math.max(0, i)));
  };
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setActive((current) => Math.min(POINTS - 1, Math.max(0, (current ?? POINTS - 1) + (event.key === "ArrowRight" ? 1 : -1))));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : POINTS - 1);
    } else if (event.key === "Escape") setActive(null);
  };
  const describe = (p: { t: number; values: number[] }) =>
    `${fmt.format(p.t)}: ${Array.from({ length: series }, (_, s) => `${market.type === "binary" ? "Yes" : market.outcomes[s].name} ${formatProbability(p.values[s])}`).join(", ")}`;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ul className="flex flex-wrap gap-1.5" aria-label="Lines">
          {Array.from({ length: series }, (_, s) => {
            const name = market.type === "binary" ? "Yes" : market.outcomes[s].name;
            return (
              <li key={name}>
                <button
                  type="button"
                  aria-pressed={!hidden[s]}
                  onClick={() => setHidden((h) => ({ ...h, [s]: !h[s] }))}
                  className={cn("flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring", hidden[s] ? "text-muted-foreground opacity-60" : "text-foreground")}
                >
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ background: COLORS[s] }} />
                  {name}
                  {last ? <span className="font-medium tabular-nums">{formatProbability(last.values[s])}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div role="tablist" aria-label="Timeframe" className="flex rounded-full bg-surface-2 p-0.5">
          {FRAMES.map((f) => (
            <button key={f.id} type="button" role="tab" aria-selected={frame === f.id} onClick={() => setFrame(f.id)} className={cn("relative h-7 cursor-pointer rounded-full px-2.5 text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", frame === f.id ? "text-foreground" : "text-[color-mix(in_oklab,var(--muted-foreground)_75%,var(--foreground))]")}>
              {frame === f.id ? <motion.span layoutId={`${id}-frame`} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }} className="absolute inset-0 rounded-full bg-background shadow-sm" /> : null}
              <span className="relative">{f.id}</span>
            </button>
          ))}
        </div>
      </div>
      <div ref={box} className="relative mt-3">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Probability chart, ${frame}. ${last ? describe(last) : ""}. Use the arrow keys to read values.`}
          tabIndex={0}
          onPointerMove={pick}
          onPointerLeave={() => setActive(null)}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
          className="block touch-pan-y overflow-visible rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {[0, 2500, 5000, 7500, 10000].map((g) => (
            <g key={g}>
              <line x1={PAD.left} x2={PAD.left + plotW} y1={y(g)} y2={y(g)} stroke="var(--border)" strokeDasharray={g === 0 ? undefined : "2 4"} />
              <text x={PAD.left + plotW + 6} y={y(g) + 4} fontSize="11" fill="var(--muted-foreground)">
                {g / 100}%
              </text>
            </g>
          ))}
          {points.length ? (
            <>
              <text x={PAD.left} y={height - 4} fontSize="11" fill="var(--muted-foreground)">
                {hydrated ? fmt.format(points[0].t) : null}
              </text>
              <text x={PAD.left + plotW} y={height - 4} fontSize="11" fill="var(--muted-foreground)" textAnchor="end">
                {hydrated ? fmt.format(end) : null}
              </text>
            </>
          ) : null}
          {Array.from({ length: series }, (_, s) =>
            hidden[s] || !points.length ? null : (
              <motion.path key={s} d={path(s)} initial={false} animate={{ d: path(s) }} transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }} fill="none" stroke={COLORS[s]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            ),
          )}
          {last
            ? Array.from({ length: series }, (_, s) =>
                hidden[s] ? null : (
                  <g key={`end-${s}`}>
                    <circle cx={x(POINTS - 1)} cy={y(last.values[s])} r="7" fill={COLORS[s]} opacity="0.25" className="origin-center animate-ping [transform-box:fill-box] motion-reduce:animate-none" />
                    <circle cx={x(POINTS - 1)} cy={y(last.values[s])} r="3.5" fill={COLORS[s]} stroke="var(--background)" strokeWidth="2" />
                  </g>
                ),
              )
            : null}
          {annotations.map((a, k) => {
            if (a.t < start || a.t > end || !points.length) return null;
            const i = Math.round(((a.t - start) / Math.max(1, end - start)) * (POINTS - 1));
            return (
              <circle
                key={a.t}
                cx={x(i)}
                cy={y(points[i].values[0])}
                r="5"
                fill="var(--background)"
                stroke="var(--foreground)"
                strokeWidth="2"
                onPointerEnter={() => setNote(k)}
                onPointerLeave={() => setNote(null)}
                className="cursor-help"
              />
            );
          })}
          {shown && active !== null ? (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--foreground)" strokeOpacity="0.3" />
              {Array.from({ length: series }, (_, s) => (hidden[s] ? null : <circle key={s} cx={x(active)} cy={y(shown.values[s])} r="4" fill={COLORS[s]} stroke="var(--background)" strokeWidth="2" />))}
            </g>
          ) : null}
        </svg>
        {shown && active !== null ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 z-10 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[12px] shadow-md"
            style={{ left: Math.min(Math.max(0, x(active) + 10), width - 150) }}
          >
            <p className="text-muted-foreground">{fmt.format(shown.t)}</p>
            {Array.from({ length: series }, (_, s) =>
              hidden[s] ? null : (
                <p key={s} className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full" style={{ background: COLORS[s] }} />
                  {market.type === "binary" ? "Yes" : market.outcomes[s].name}
                  <span className="ml-auto pl-3 font-medium tabular-nums">{formatProbability(shown.values[s])}</span>
                </p>
              ),
            )}
          </div>
        ) : null}
        {note !== null && annotations[note] ? (
          <div role="tooltip" className="pointer-events-none absolute top-8 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-[12px] text-background shadow-md">
            {annotations[note].label}
          </div>
        ) : null}
      </div>
      <p aria-live="polite" className="sr-only">
        {shown ? describe(shown) : ""}
      </p>
      <table className="sr-only">
        <caption>Probability by time</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            {Array.from({ length: series }, (_, s) => (
              <th key={s} scope="col">
                {market.type === "binary" ? "Yes" : market.outcomes[s].name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.filter((_, i) => i % 6 === 0 || i === POINTS - 1).map((p) => (
            <tr key={p.t}>
              <th scope="row">{hydrated ? fmt.format(p.t) : null}</th>
              {p.values.map((v, s) => (
                <td key={s}>{formatProbability(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
