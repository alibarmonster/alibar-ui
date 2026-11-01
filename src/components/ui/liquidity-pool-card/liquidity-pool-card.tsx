"use client";

import { useId, useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { RangeSlider } from "@/components/ui/range-slider/range-slider";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { formatBps, formatUsd, USD_DECIMALS } from "@/lib/web3/format";
import { TokenIcon } from "@/lib/web3/icons";
import type { Token } from "@/lib/web3/types";

export type LiquidityStatus = "idle" | "adding" | "added";

export interface LiquidityPoolCardProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Base token (prices are quoted as tokenB per tokenA). */
  tokenA: Token;
  /** Quote token. */
  tokenB: Token;
  /** Pool fee tier in basis points (30 = 0.3%). */
  feeBps: number;
  /** Total value locked in USD, bigint with 8 decimals. */
  tvl: bigint;
  /** 24h volume in USD, bigint with 8 decimals. */
  volume24h?: bigint;
  /** Full-range APR in basis points. */
  aprBps: number;
  /** Current price of tokenA in tokenB. A display number used for range math. */
  price: number;
  /** Controlled price range [min, max]. */
  range?: [number, number];
  /** Initial range when uncontrolled. @default ±20% around the price */
  defaultRange?: [number, number];
  /** Called while the range changes. */
  onRangeChange?: (range: [number, number]) => void;
  /** Initial state of the add-liquidity panel. @default false */
  defaultExpanded?: boolean;
  /** Add-liquidity progress. @default "idle" */
  status?: LiquidityStatus;
  /** Called with the chosen range from the confirm button. */
  onAddLiquidity?: (range: [number, number]) => void;
  /** Formats prices. @default 2 decimals with grouping */
  formatPrice?: (price: number) => string;
}

const compactUsd = (value: bigint) => formatUsd(value, USD_DECIMALS, { compact: true });

export function LiquidityPoolCard({
  tokenA,
  tokenB,
  feeBps,
  tvl,
  volume24h,
  aprBps,
  price,
  range,
  defaultRange,
  onRangeChange,
  defaultExpanded = false,
  status = "idle",
  onAddLiquidity,
  formatPrice = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  className,
  ...props
}: LiquidityPoolCardProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const lo = price * 0.5;
  const hi = price * 1.5;
  const [internalRange, setInternalRange] = useState<[number, number]>(defaultRange ?? [price * 0.8, price * 1.2]);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const current = range ?? internalRange;
  const [min, max] = current;
  const fullRange = min <= lo && max >= hi;
  const inRange = price >= min && price <= max;
  // Narrower ranges concentrate liquidity: APR scales with full width ÷ chosen width (capped at 10×).
  const boost = Math.min(10, (hi - lo) / Math.max(max - min, (hi - lo) / 10));
  const rangeApr = inRange ? Math.round(aprBps * (fullRange ? 1 : boost)) : 0;
  const marker = ((price - lo) / (hi - lo)) * 100;

  const setRange = (next: [number, number]) => {
    if (range === undefined) setInternalRange(next);
    onRangeChange?.(next);
  };

  const pairLabel = `${tokenA.symbol} / ${tokenB.symbol}`;

  return (
    <div className={cn("w-full max-w-sm rounded-3xl border border-border bg-background p-5 shadow-md", className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex" aria-hidden="true">
            <TokenIcon token={tokenA} size={36} className="relative z-10 rounded-full ring-2 ring-background" />
            <TokenIcon token={tokenB} size={36} className="-ml-3 rounded-full ring-2 ring-background" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{pairLabel}</p>
            <p className="text-xs text-muted-foreground">Concentrated liquidity</p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-xs font-medium text-foreground tabular-nums">
          {formatBps(feeBps)}
          <span className="sr-only"> fee tier</span>
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-xl bg-surface py-3">
        <div className="px-3">
          <dt className="text-xs text-muted-foreground">TVL</dt>
          <dd className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">{compactUsd(tvl)}</dd>
        </div>
        <div className="px-3">
          <dt className="text-xs text-muted-foreground">APR</dt>
          <dd className="mt-0.5 font-mono text-sm font-semibold text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))] tabular-nums">
            {formatBps(aprBps)}
          </dd>
        </div>
        <div className="px-3">
          <dt className="text-xs text-muted-foreground">Volume 24h</dt>
          <dd className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">{volume24h !== undefined ? compactUsd(volume24h) : "—"}</dd>
        </div>
      </dl>

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`${id}-panel`}
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Add liquidity
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", expanded && "rotate-180")} aria-hidden="true" />
      </button>

      <div
        id={`${id}-panel`}
        className={cn("grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
        inert={!expanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-foreground">Price range</p>
              <button
                type="button"
                aria-pressed={fullRange}
                onClick={() => setRange(fullRange ? [price * 0.8, price * 1.2] : [lo, hi])}
                className={cn(
                  "h-7 cursor-pointer rounded-full border px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  fullRange ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Full range
              </button>
            </div>
            <div className="relative mt-6">
              <span
                aria-hidden="true"
                className="absolute -top-5 flex -translate-x-1/2 flex-col items-center text-[10px] font-medium text-muted-foreground"
                style={{ left: `${marker}%` }}
              >
                Now
                <span className="mt-0.5 h-3 w-px bg-foreground/40" />
              </span>
              <RangeSlider
                value={current}
                onValueChange={(v) => setRange([v[0], v[1]])}
                min={lo}
                max={hi}
                step={(hi - lo) / 200}
                ticks={false}
                formatValue={(v) => formatPrice(v)}
                thumbLabels={[`Minimum price, ${tokenB.symbol} per ${tokenA.symbol}`, `Maximum price, ${tokenB.symbol} per ${tokenA.symbol}`]}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: "Min price", value: min },
                { label: "Max price", value: max },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-surface p-2.5 text-center">
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                  <p className="font-mono text-sm font-semibold text-foreground tabular-nums">{formatPrice(item.value)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {tokenB.symbol} per {tokenA.symbol}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-medium",
                  inRange ? "text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]" : "text-[color-mix(in_oklab,var(--warning)_55%,var(--foreground))]",
                )}
              >
                <span className={cn("size-1.5 rounded-full", inRange ? "bg-success" : "bg-warning")} aria-hidden="true" />
                {inRange ? "In range" : "Out of range: earns no fees until the price returns"}
              </span>
              {inRange ? <span className="font-mono text-muted-foreground tabular-nums">Est. APR {formatBps(rangeApr)}</span> : null}
            </div>
            <button
              type="button"
              disabled={status !== "idle"}
              aria-busy={status === "adding" || undefined}
              onClick={() => onAddLiquidity?.(current)}
              className={cn(
                "mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default",
                status === "added" ? "bg-success text-white" : "bg-foreground text-background enabled:hover:bg-foreground/90",
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={status}
                  className="flex items-center gap-2"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(3px)" }}
                  transition={{ duration: duration.quick, ease: ease.out }}
                >
                  {status === "adding" ? (
                    <>
                      <svg className="size-4 animate-spin motion-reduce:animate-pulse" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      Adding liquidity…
                    </>
                  ) : status === "added" ? (
                    <>
                      <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                      Position created
                    </>
                  ) : (
                    `Add to ${pairLabel}`
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "adding" ? "Adding liquidity" : status === "added" ? "Position created" : ""}
      </span>
    </div>
  );
}
