"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ArrowDownUp, Check, ChevronDown, ChevronRight } from "lucide-react";
import { formatUnits } from "viem";
import { SlippageSettings } from "@/components/ui/slippage-settings/slippage-settings";
import { TokenAmountInput } from "@/components/ui/token-amount-input/token-amount-input";
import { TokenSelectorModal } from "@/components/ui/token-selector-modal/token-selector-modal";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";
import { formatAmount, formatBps, parseAmount } from "@/lib/web3/format";
import type { Token } from "@/lib/web3/types";

export interface SwapQuote {
  /** Output amount in the output token's smallest unit. */
  amountOut: bigint;
  /** Least the swap may return after slippage. */
  minimumOut: bigint;
  /** Output units per one whole input token, in output decimals. */
  rate: bigint;
  /** Price impact in basis points. */
  priceImpactBps: bigint;
  /** Protocol fee in basis points. */
  feeBps?: bigint;
  /** Hops by symbol, e.g. ["ARB", "ETH", "USDC"]. */
  route?: string[];
  /** Pre-formatted network fee, e.g. "$4.12". */
  networkFee?: string;
}

export type SwapStatus = "idle" | "swapping" | "success" | "failed";
export type ApprovalStatus = "required" | "pending" | "approved";

export interface TokenSwapWidgetProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Tokens offered in the selectors. */
  tokens: Token[];
  /** Balances by symbol, in each token's smallest unit. */
  balances?: Record<string, bigint>;
  /** Symbols popular in the token selector. */
  popular?: string[];
  /** Initial input token symbol. @default tokens[0] */
  defaultFrom?: string;
  /** Initial output token symbol. @default tokens[1] */
  defaultTo?: string;
  /** Initial amount text for the input token. @default "" */
  defaultAmount?: string;
  /** Returns a quote for an input amount. Called on every change, so keep it fast (or memoize your async result). */
  getQuote?: (from: Token, to: Token, amountIn: bigint) => SwapQuote | null;
  /** Shimmer the output and hold the button while a quote loads. @default false */
  quoteLoading?: boolean;
  /** Seconds a quote stays fresh; a ring counts down, then onQuoteRefresh fires. @default 20 */
  quoteTtl?: number;
  /** Called when the countdown ends. Fetch a new quote here. */
  onQuoteRefresh?: () => void;
  /** Token approval state for the input token. @default "approved" */
  approval?: ApprovalStatus;
  /** Called from the Approve button. */
  onApprove?: (token: Token, amount: bigint) => void;
  /** Swap lifecycle. A return from "success" to "idle" clears the amount. @default "idle" */
  status?: SwapStatus;
  /** Called from the Swap button with everything needed to build the transaction. */
  onSwap?: (swap: { from: Token; to: Token; amountIn: bigint; quote: SwapQuote }) => void;
  /** Max slippage in basis points, shown in the header. */
  slippageBps?: number;
  /** Called when slippage changes. Shows the slippage settings when provided. */
  onSlippageChange?: (bps: number) => void;
  /** Header title. @default "Swap" */
  title?: string;
}

type Slot = "a" | "b";

function Countdown({ ttl, restartKey, onDone }: { ttl: number; restartKey: string; onDone: () => void }) {
  const ref = useRef<SVGCircleElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const circle = ref.current;
    if (!circle || typeof circle.animate !== "function") return;
    const animation = circle.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 1 }], { duration: ttl * 1000, easing: "linear", fill: "forwards" });
    animation.onfinish = () => done.current();
    return () => animation.cancel();
  }, [ttl, restartKey]);
  return (
    <svg viewBox="0 0 20 20" className="size-4 -rotate-90" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="var(--border)" strokeWidth="2.5" />
      <circle ref={ref} cx="10" cy="10" r="7.5" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" />
    </svg>
  );
}

const Spinner = () => (
  <svg className="size-4 animate-spin motion-reduce:animate-pulse" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export function TokenSwapWidget({
  tokens,
  balances = {},
  popular,
  defaultFrom,
  defaultTo,
  defaultAmount = "",
  getQuote,
  quoteLoading = false,
  quoteTtl = 20,
  onQuoteRefresh,
  approval = "approved",
  onApprove,
  status = "idle",
  onSwap,
  slippageBps,
  onSlippageChange,
  title = "Swap",
  className,
  ...props
}: TokenSwapWidgetProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [sides, setSides] = useState<Record<Slot, string>>({
    a: defaultFrom ?? tokens[0]?.symbol ?? "",
    b: defaultTo ?? tokens[1]?.symbol ?? "",
  });
  const [fromSlot, setFromSlot] = useState<Slot>("a");
  const [amount, setAmount] = useState(defaultAmount);
  const [turns, setTurns] = useState(0);
  const [selecting, setSelecting] = useState<Slot | null>(null);
  const [inverted, setInverted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [refreshes, setRefreshes] = useState(0);

  const toSlot: Slot = fromSlot === "a" ? "b" : "a";
  const find = (symbol: string) => tokens.find((t) => t.symbol === symbol);
  const from = find(sides[fromSlot]);
  const to = find(sides[toSlot]);
  const amountIn = from ? parseAmount(amount, from.decimals) : null;
  const quote = from && to && amountIn && amountIn > BigInt(0) && getQuote ? getQuote(from, to, amountIn) : null;
  const balance = from ? balances[from.symbol] : undefined;
  const insufficient = amountIn !== null && balance !== undefined && amountIn > balance;
  const impact = quote?.priceImpactBps ?? BigInt(0);

  // Clear the form once a finished swap is acknowledged (status goes back to idle).
  const [previousStatus, setPreviousStatus] = useState(status);
  if (status !== previousStatus) {
    setPreviousStatus(status);
    if (previousStatus === "success" && status === "idle") setAmount("");
  }

  function flip() {
    setTurns(turns + 1);
    setFromSlot(toSlot);
    // Carry the output over, cut (never rounded up) to 6 decimals so the field stays readable.
    setAmount(quote && to ? formatUnits(quote.amountOut, to.decimals).replace(/(\.\d{6})\d+$/, "$1") : "");
  }

  function pick(token: Token) {
    if (!selecting) return;
    setSides({ ...sides, [selecting]: token.symbol });
  }

  const stage = (() => {
    if (!from || !to) return { label: "Select tokens", disabled: true };
    if (!amountIn || amountIn === BigInt(0)) return { label: "Enter an amount", disabled: true };
    if (insufficient) return { label: `Insufficient ${from.symbol} balance`, disabled: true, tone: "error" as const };
    if (quoteLoading || !quote) return { label: "Finding the best price…", disabled: true, busy: true };
    if (approval === "required") return { label: `Approve ${from.symbol}`, action: () => onApprove?.(from, amountIn) };
    if (approval === "pending") return { label: `Approving ${from.symbol}…`, disabled: true, busy: true };
    if (status === "swapping") return { label: "Swapping…", disabled: true, busy: true };
    if (status === "success") return { label: "Swapped", disabled: true, done: true };
    if (status === "failed") return { label: "Swap failed · Try again", action: () => onSwap?.({ from, to, amountIn, quote }), tone: "error" as const };
    if (impact >= BigInt(1000)) return { label: "Swap anyway", action: () => onSwap?.({ from, to, amountIn, quote }), tone: "error" as const };
    return { label: "Swap", action: () => onSwap?.({ from, to, amountIn, quote }) };
  })();

  const inverse = quote && from && to && quote.rate > BigInt(0) ? (BigInt(10) ** BigInt(from.decimals + to.decimals)) / quote.rate : undefined;
  const rateText =
    quote && from && to
      ? inverted && inverse !== undefined
        ? `1 ${to.symbol} = ${formatAmount(inverse, from.decimals, { maxFractionDigits: 6 })} ${from.symbol}`
        : `1 ${from.symbol} = ${formatAmount(quote.rate, to.decimals, { maxFractionDigits: 4 })} ${to.symbol}`
      : null;
  const impactTone =
    impact >= BigInt(1000)
      ? "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]"
      : impact >= BigInt(300)
        ? "text-[color-mix(in_oklab,var(--warning)_55%,var(--foreground))]"
        : "text-foreground";

  const panel = (slot: Slot) => {
    const isFrom = slot === fromSlot;
    const token = find(sides[slot]);
    return (
      <motion.div key={slot} layout={reduceMotion ? false : "position"} transition={spring.smooth}>
        {isFrom ? (
          <TokenAmountInput
            label="You pay"
            token={token}
            balance={token ? balances[token.symbol] : undefined}
            value={amount}
            onValueChange={(text) => setAmount(text)}
            onTokenClick={() => setSelecting(slot)}
          />
        ) : (
          <TokenAmountInput
            label="You receive"
            token={token}
            value={quote && token ? formatAmount(quote.amountOut, token.decimals, { maxFractionDigits: 6 }) : ""}
            readOnly
            loading={quoteLoading && Boolean(amountIn)}
            percentages={[]}
            onTokenClick={() => setSelecting(slot)}
          />
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn("w-full max-w-md rounded-3xl border border-border bg-background p-2 shadow-md", className)} {...props}>
      <div className="flex h-11 items-center justify-between pr-1 pl-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {onSlippageChange && slippageBps !== undefined ? <SlippageSettings value={slippageBps} onValueChange={onSlippageChange} /> : null}
      </div>

      <div className="relative space-y-1">
        {fromSlot === "a" ? [panel("a"), panel("b")] : [panel("b"), panel("a")]}
        <div className="absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center">
          <motion.button
            type="button"
            onClick={flip}
            aria-label={`Switch: pay with ${to?.symbol ?? "the other token"} instead`}
            animate={{ rotate: turns * 180 }}
            transition={reduceMotion ? { duration: 0 } : spring.snappy}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
            className="grid size-10 cursor-pointer place-items-center rounded-xl border-4 border-background bg-surface text-foreground shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowDownUp className="size-4" aria-hidden="true" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {quote && rateText ? (
          <motion.div
            key="quote"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.quick, ease: ease.out }}
            className="px-2 pt-2"
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setInverted(!inverted)}
                aria-label={`${rateText}. Show the inverse rate`}
                className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-1 py-1 font-mono text-xs text-muted-foreground tabular-nums outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Countdown
                  ttl={quoteTtl}
                  restartKey={`${sides.a}:${sides.b}:${fromSlot}:${amount}:${refreshes}`}
                  onDone={() => {
                    setRefreshes((n) => n + 1);
                    onQuoteRefresh?.();
                  }}
                />
                <span className="truncate">{rateText}</span>
              </button>
              <button
                type="button"
                aria-expanded={detailsOpen}
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className={cn("font-mono tabular-nums", impactTone)}>{formatBps(impact)}</span> impact
                <ChevronDown className={cn("size-3.5 transition-transform duration-200", detailsOpen && "rotate-180")} aria-hidden="true" />
              </button>
            </div>
            <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none", detailsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")} inert={!detailsOpen}>
              <dl className="min-h-0 space-y-1.5 overflow-hidden px-1 text-xs">
                <div className="flex justify-between gap-3 pt-2">
                  <dt className="text-muted-foreground">Price impact</dt>
                  <dd className={cn("font-mono tabular-nums", impactTone)}>{formatBps(impact)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Minimum received</dt>
                  <dd className="font-mono text-foreground tabular-nums">
                    {to ? `${formatAmount(quote.minimumOut, to.decimals)} ${to.symbol}` : "—"}
                  </dd>
                </div>
                {quote.feeBps !== undefined ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Fee</dt>
                    <dd className="font-mono text-foreground tabular-nums">{formatBps(quote.feeBps)}</dd>
                  </div>
                ) : null}
                {quote.networkFee ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Network fee</dt>
                    <dd className="font-mono text-foreground tabular-nums">{quote.networkFee}</dd>
                  </div>
                ) : null}
                {quote.route?.length ? (
                  <div className="flex justify-between gap-3 pb-1">
                    <dt className="text-muted-foreground">Route</dt>
                    <dd className="flex items-center gap-1 text-foreground">
                      {quote.route.map((hop, index) => (
                        <span key={`${hop}-${index}`} className="flex items-center gap-1">
                          {index > 0 ? <ChevronRight className="size-3 text-muted-foreground" aria-label="then" /> : null}
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{hop}</span>
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {impact >= BigInt(1000) && status === "idle" ? (
        <div role="alert" className="mx-1 mt-2 flex gap-2 rounded-xl bg-destructive/8 p-3 text-xs leading-5 text-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]" aria-hidden="true" />
          Price impact is {formatBps(impact)}. You&apos;d receive much less than the market rate; try a smaller amount.
        </div>
      ) : null}

      <button
        type="button"
        onClick={stage.action}
        disabled={stage.disabled}
        aria-busy={stage.busy || undefined}
        className={cn(
          "mt-2 flex h-13 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl text-[15px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed",
          stage.tone === "error"
            ? "bg-destructive/10 text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))] enabled:hover:bg-destructive/15"
            : stage.done
              ? "bg-success text-white"
              : stage.disabled && !stage.busy
                ? "bg-muted text-muted-foreground"
                : "bg-foreground text-background enabled:hover:bg-foreground/90",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={stage.label}
            className="flex items-center gap-2"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: duration.quick, ease: ease.out }}
          >
            {stage.busy ? <Spinner /> : null}
            {stage.done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : null}
            {stage.label}
          </motion.span>
        </AnimatePresence>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {stage.busy || stage.done || stage.tone === "error" ? stage.label : ""}
      </span>

      <TokenSelectorModal
        open={selecting !== null}
        onOpenChange={(open) => {
          if (!open) setSelecting(null);
        }}
        tokens={tokens}
        balances={balances}
        popular={popular}
        selected={selecting ? sides[selecting] : undefined}
        disabledSymbol={selecting ? sides[selecting === "a" ? "b" : "a"] : undefined}
        onSelect={pick}
      />
    </div>
  );
}
