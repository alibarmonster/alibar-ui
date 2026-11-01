"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export interface Candle {
  /** Open time in ms since epoch. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PriceChartProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Candles for the selected timeframe, oldest first. */
  data: Candle[];
  /** Pair label in the header. @default "ETH/USD" */
  pair?: string;
  /** Timeframe tabs. @default ["1H", "1D", "1W", "1M"] */
  timeframes?: string[];
  /** Controlled timeframe. */
  timeframe?: string;
  /** Initial timeframe when uncontrolled. @default the second timeframe */
  defaultTimeframe?: string;
  /** Called when a timeframe tab is picked. Load that timeframe's data here. */
  onTimeframeChange?: (timeframe: string) => void;
  /** Formats prices on the axis, tooltip and header. @default USD with 2 decimals */
  formatPrice?: (price: number) => string;
  /** Chart height in pixels, excluding the header. @default 280 */
  height?: number;
  /** Show a skeleton while data loads. @default false */
  loading?: boolean;
  /** Time zone for time labels. Fixed by default so server and client agree. @default "UTC" */
  timeZone?: string;
}

const PAD = { top: 12, right: 76, bottom: 24, left: 4 };
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const UP = "var(--success)";
const DOWN = "var(--destructive)";

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1;
  const step = 10 ** Math.floor(Math.log10(span / count));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => span / s <= count) ?? step * 10;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / nice) * nice; v <= max; v += nice) ticks.push(v);
  return ticks;
}

export function PriceChart({
  data,
  pair = "ETH/USD",
  timeframes = ["1H", "1D", "1W", "1M"],
  timeframe,
  defaultTimeframe,
  onTimeframeChange,
  formatPrice = (n) => usd.format(n),
  height = 280,
  loading = false,
  timeZone = "UTC",
  className,
  ...props
}: PriceChartProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const [internalTf, setInternalTf] = useState(defaultTimeframe ?? timeframes[1] ?? timeframes[0]);
  const tf = timeframe ?? internalTf;
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const choose = (next: string) => {
    if (timeframe === undefined) setInternalTf(next);
    onTimeframeChange?.(next);
    setActive(null);
  };

  const n = data.length;
  const first = data[0];
  const last = data[n - 1];
  const change = first && last ? (last.close - first.open) / first.open : 0;
  const lows = data.map((d) => d.low);
  const highs = data.map((d) => d.high);
  const min = n ? Math.min(...lows) : 0;
  const max = n ? Math.max(...highs) : 1;
  const pad = (max - min) * 0.08 || 1;
  const yMin = min - pad;
  const yMax = max + pad;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const priceH = (height - PAD.top - PAD.bottom) * 0.82;
  const volTop = PAD.top + priceH + 6;
  const volH = height - PAD.bottom - volTop;
  const step = n ? plotW / n : 0;
  const x = (i: number) => PAD.left + step * (i + 0.5);
  const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * priceH;
  const maxVol = Math.max(1, ...data.map((d) => d.volume ?? 0));
  const ticks = niceTicks(min, max);
  const bodyW = Math.max(1, Math.min(14, step * 0.62));

  const longRange = n > 1 && last.time - first.time > 2 * 86_400_000;
  const timeLabel = new Intl.DateTimeFormat("en-US", longRange ? { month: "short", day: "numeric", timeZone } : { hour: "2-digit", minute: "2-digit", hour12: false, timeZone });
  const fullTime = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone });
  const focus = active !== null ? data[active] : null;

  function onPointerMove(event: PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const i = Math.floor(((event.clientX - rect.left) / rect.width) * n);
    setActive(Math.min(n - 1, Math.max(0, i)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!n) return;
    const keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    if (event.key in keys) {
      event.preventDefault();
      setActive((a) => Math.min(n - 1, Math.max(0, (a ?? n - 1) + keys[event.key])));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : n - 1);
    } else if (event.key === "Escape") {
      setActive(null);
    }
  }

  const up = change >= 0;
  const describe = (c: Candle) =>
    `${fullTime.format(c.time)}: open ${formatPrice(c.open)}, high ${formatPrice(c.high)}, low ${formatPrice(c.low)}, close ${formatPrice(c.close)}`;

  return (
    <div className={cn("w-full max-w-2xl rounded-2xl border border-border bg-background p-4 shadow-sm", className)} {...props}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted-foreground">{pair}</p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {loading || !last ? "—" : formatPrice((focus ?? last).close)}
            </span>
            {!loading && last ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-mono text-xs tabular-nums",
                  up ? "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" : "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]",
                )}
              >
                {up ? <TrendingUp className="size-3" aria-hidden="true" /> : <TrendingDown className="size-3" aria-hidden="true" />}
                {up ? "+" : ""}
                {(change * 100).toFixed(2)}%<span className="sr-only"> over {tf}</span>
              </span>
            ) : null}
          </p>
        </div>
        <LayoutGroup id={id}>
          <div role="radiogroup" aria-label="Timeframe" className="flex gap-0.5 rounded-lg bg-muted p-0.5">
            {timeframes.map((option) => {
              const selected = option === tf;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(option)}
                  className={cn(
                    "relative h-8 min-w-10 cursor-pointer rounded-md px-2 font-mono text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "text-foreground" : "text-foreground/60 hover:text-foreground",
                  )}
                >
                  {selected ? (
                    <motion.span
                      layoutId="timeframe"
                      transition={reduceMotion ? { duration: 0 } : spring.snappy}
                      className="absolute inset-0 rounded-md bg-background shadow-xs"
                    />
                  ) : null}
                  <span className="relative">{option}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <div
        ref={box}
        tabIndex={0}
        role="group"
        aria-roledescription="chart"
        aria-label={`${pair} candlestick chart, ${tf}. Use arrow keys to inspect candles.`}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((a) => a ?? (n ? n - 1 : null))}
        onBlur={() => setActive(null)}
        className="relative mt-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ height }}
      >
        {loading || width === 0 ? (
          <div className={cn("absolute inset-0 rounded-lg bg-muted/60", loading && "animate-pulse motion-reduce:animate-none")} aria-hidden="true" />
        ) : n === 0 ? (
          <p className="absolute inset-0 grid place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            No price data for this timeframe.
          </p>
        ) : (
          <svg width={width} height={height} className="block overflow-visible" aria-hidden="true">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="2 4" />
                <text x={PAD.left + plotW + 8} y={y(t)} dy="0.35em" fontSize="11" fill="var(--muted-foreground)" className="font-mono tabular-nums">
                  {formatPrice(t)}
                </text>
              </g>
            ))}
            <AnimatePresence initial={false} mode="popLayout">
              <motion.g
                key={`${tf}:${n}:${first?.time}`}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0% 100% 0% 0%)" }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {data.map((c, i) => {
                  const rising = c.close >= c.open;
                  const color = rising ? UP : DOWN;
                  const top = y(Math.max(c.open, c.close));
                  const bodyH = Math.max(1, Math.abs(y(c.open) - y(c.close)));
                  const vh = ((c.volume ?? 0) / maxVol) * volH;
                  return (
                    <g key={c.time} opacity={active !== null && active !== i ? 0.55 : 1}>
                      <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} />
                      <rect x={x(i) - bodyW / 2} y={top} width={bodyW} height={bodyH} rx={Math.min(1.5, bodyW / 4)} fill={color} />
                      {c.volume !== undefined ? (
                        <rect x={x(i) - bodyW / 2} y={volTop + volH - vh} width={bodyW} height={vh} rx={1} fill={color} opacity={0.22} />
                      ) : null}
                    </g>
                  );
                })}
              </motion.g>
            </AnimatePresence>
            {last ? (
              <g>
                <line x1={PAD.left} x2={PAD.left + plotW} y1={y(last.close)} y2={y(last.close)} stroke={up ? UP : DOWN} strokeDasharray="3 3" opacity={0.7} />
                <rect x={PAD.left + plotW + 2} y={y(last.close) - 9} width={PAD.right - 4} height={18} rx={4} fill={up ? UP : DOWN} />
                <text x={PAD.left + plotW + 8} y={y(last.close)} dy="0.35em" fontSize="11" fill="#fff" className="font-mono tabular-nums">
                  {formatPrice(last.close)}
                </text>
              </g>
            ) : null}
            {n > 1
              ? [0, Math.floor((n - 1) / 2), n - 1].map((i) => (
                  <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="11" fill="var(--muted-foreground)">
                    {timeLabel.format(data[i].time)}
                  </text>
                ))
              : null}
            {focus && active !== null ? (
              <g pointerEvents="none">
                <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={height - PAD.bottom} stroke="var(--foreground)" strokeOpacity={0.35} strokeDasharray="3 3" />
                <line x1={PAD.left} x2={PAD.left + plotW} y1={y(focus.close)} y2={y(focus.close)} stroke="var(--foreground)" strokeOpacity={0.35} strokeDasharray="3 3" />
                <rect x={PAD.left + plotW + 2} y={y(focus.close) - 9} width={PAD.right - 4} height={18} rx={4} fill="var(--foreground)" />
                <text x={PAD.left + plotW + 8} y={y(focus.close)} dy="0.35em" fontSize="11" fill="var(--background)" className="font-mono tabular-nums">
                  {formatPrice(focus.close)}
                </text>
              </g>
            ) : null}
            <rect
              x={PAD.left}
              y={PAD.top}
              width={plotW}
              height={height - PAD.top - PAD.bottom}
              fill="transparent"
              onPointerMove={onPointerMove}
              onPointerLeave={() => setActive(null)}
            />
          </svg>
        )}
        {focus && active !== null && width > 0 ? (
          <div
            className="pointer-events-none absolute top-2 z-10 w-44 rounded-lg border border-border bg-popover/95 p-2.5 text-xs shadow-md backdrop-blur"
            style={{ left: Math.min(Math.max(0, x(active) + (x(active) > width / 2 ? -188 : 12)), width - 180) }}
          >
            <p className="font-medium text-foreground">{fullTime.format(focus.time)}</p>
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono tabular-nums">
              {(["open", "high", "low", "close"] as const).map((k) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground capitalize">{k}</dt>
                  <dd className="text-right text-foreground">{formatPrice(focus[k])}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        <span className="sr-only" role="status" aria-live="polite">
          {focus ? describe(focus) : ""}
        </span>
      </div>

      <table className="sr-only">
        <caption>
          {pair} prices, {tf}
        </caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Open</th>
            <th scope="col">High</th>
            <th scope="col">Low</th>
            <th scope="col">Close</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.time}>
              <th scope="row">{fullTime.format(c.time)}</th>
              <td>{formatPrice(c.open)}</td>
              <td>{formatPrice(c.high)}</td>
              <td>{formatPrice(c.low)}</td>
              <td>{formatPrice(c.close)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
