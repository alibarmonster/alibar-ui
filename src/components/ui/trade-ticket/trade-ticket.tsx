"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useAnimate, useReducedMotion } from "motion/react";
import { Minus, Plus, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TokenAmountInput } from "@/components/ui/token-amount-input/token-amount-input";
import { TransactionToastStack, type TransactionToastItem } from "@/components/ui/transaction-toast/transaction-toast";
import { formatPrice, formatReturn, formatShares, formatUsd } from "@/lib/markets/format";
import { FULL, complement, quoteBuy, quoteLimit, quoteSell } from "@/lib/markets/math";
import type { Market, TradeSide } from "@/lib/markets/types";
import { RollingValue } from "@/lib/web3/rolling-value";
import type { Token } from "@/lib/web3/types";

export interface TradeTicketProps {
  /** The market to trade. Everything is simulated. */
  market: Market;
  /** Outcome to start on. @default the first outcome */
  outcomeId?: string;
  /** For binary markets: buy Yes or No. @default "yes" */
  choice?: "yes" | "no";
  /** Buy or Sell tab to start on. @default "buy" */
  defaultSide?: TradeSide;
  /** Simulated USDC balance, in cents. @default 50000 */
  balance?: number;
  /** Shares held of the selected outcome (hundredths), for Sell. @default 0 */
  position?: number;
  /** Shared layout id, so a pressed Market Card button morphs into the ticket. */
  layoutId?: string;
  /** Simulate a failed order (the button shakes and an error shows). @default false */
  simulateFailure?: boolean;
  /** Shows a close button. */
  onClose?: () => void;
  /** Fires when a simulated order succeeds. */
  onTrade?: (trade: { side: TradeSide; outcomeId: string; choice: "yes" | "no"; amount: number; shares: number; price: number }) => void;
  /** Classes for the ticket. */
  className?: string;
}

const USDC: Token = { symbol: "USDC", name: "USD Coin (simulated)", decimals: 6, color: "#2563EB" };
const IMPACT_WARNING = 500;
type Status = "idle" | "confirming" | "success" | "error";

const toCents = (amount: bigint | null) => (amount === null ? 0 : Number(amount / BigInt(10000)));

/**
 * A simulated order ticket: Buy/Sell, Yes/No (or an outcome), an amount with quick chips, a live
 * summary (average price, shares, payout, return, price impact) and an optional limit price.
 * Integer math only; nothing is sent anywhere.
 */
export function TradeTicket({
  market,
  outcomeId,
  choice: initialChoice = "yes",
  defaultSide = "buy",
  balance = 50000,
  position = 0,
  layoutId,
  simulateFailure = false,
  onClose,
  onTrade,
  className,
}: TradeTicketProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const binary = market.type === "binary";
  const [side, setSide] = useState<TradeSide>(defaultSide);
  const [choice, setChoice] = useState<"yes" | "no">(initialChoice);
  const [outcome, setOutcome] = useState(outcomeId ?? market.outcomes[0].id);
  const [value, setValue] = useState("");
  const [amount, setAmount] = useState(0);
  const [limitMode, setLimitMode] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [toasts, setToasts] = useState<TransactionToastItem[]>([]);
  const [scope, animate] = useAnimate();

  const selected = market.outcomes.find((o) => o.id === outcome) ?? market.outcomes[0];
  const basePrice = binary ? (choice === "yes" ? market.outcomes[0].price : complement(market.outcomes[0].price)) : selected.price;
  const [limitPrice, setLimitPrice] = useState(Math.round(basePrice / 100) * 100);
  const label = binary ? (choice === "yes" ? "Yes" : "No") : selected.name;

  // Buy: amount is dollars (cents); Sell: amount is shares (hundredths).
  const buyQuote = limitMode ? quoteLimit(limitPrice, amount) : quoteBuy(basePrice, amount, market.liquidity);
  const sellQuote = quoteSell(basePrice, amount, market.liquidity);
  const impact = side === "buy" ? buyQuote.impact : -sellQuote.impact;
  const over = side === "buy" ? amount > balance : amount > position;

  useEffect(() => {
    if (status !== "confirming") return;
    const timer = window.setTimeout(() => {
      if (simulateFailure) {
        setStatus("error");
        if (!reduceMotion && scope.current) animate(scope.current, { x: [0, -8, 8, -6, 6, -2, 0] }, { duration: 0.42 });
        setToasts((list) => [...list, { id: `${Date.now()}`, title: `Order for ${label} failed`, description: "Price moved past your limit (simulated)", status: "failed" }]);
        return;
      }
      setStatus("success");
      const shares = side === "buy" ? buyQuote.shares : amount;
      onTrade?.({ side, outcomeId: selected.id, choice, amount: side === "buy" ? amount : sellQuote.proceeds, shares, price: side === "buy" ? buyQuote.averagePrice : sellQuote.averagePrice });
      setToasts((list) => [
        ...list,
        {
          id: `${Date.now()}`,
          title: side === "buy" ? `Bought ${formatShares(shares)} ${label}` : `Sold ${formatShares(shares)} ${label}`,
          description: side === "buy" ? `${formatUsd(amount)} at ${formatPrice(buyQuote.averagePrice)} avg (simulated)` : `Received ${formatUsd(sellQuote.proceeds)} (simulated)`,
          status: "confirmed",
        },
      ]);
    }, 1400);
    return () => window.clearTimeout(timer);
    // The order is captured when it starts confirming.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const setAmountValue = (next: string, parsed: bigint | null) => {
    setValue(next);
    setAmount(side === "buy" ? toCents(parsed) : parsed === null ? 0 : Number(parsed));
    if (status !== "confirming") setStatus("idle");
  };
  const addDollars = (dollars: number | "max") => {
    const cents = dollars === "max" ? balance : amount + dollars * 100;
    const capped = Math.min(cents, balance);
    setValue((capped / 100).toFixed(2).replace(/\.00$/, ""));
    setAmount(capped);
    setStatus("idle");
  };
  const switchSide = (next: TradeSide) => {
    setSide(next);
    setValue("");
    setAmount(0);
    setStatus("idle");
  };

  const action = status === "confirming" ? "Confirming…" : status === "success" ? "Done" : amount <= 0 ? "Enter amount" : over ? (side === "buy" ? "Insufficient balance" : "Not enough shares") : `${side === "buy" ? "Buy" : "Sell"} ${label}`;
  const disabled = status === "confirming" || (status !== "success" && (amount <= 0 || over));
  const submit = () => {
    if (status === "success") {
      setStatus("idle");
      setValue("");
      setAmount(0);
      return;
    }
    if (!disabled) setStatus("confirming");
  };

  const shareToken: Token = { symbol: label.slice(0, 8), name: `${label} shares`, decimals: 2, color: "#16A34A" };

  return (
    <motion.section
      layoutId={layoutId}
      aria-labelledby={`${id}-title`}
      className={cn("relative w-full max-w-sm rounded-2xl border border-border bg-background p-4 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_16px_40px_-20px_rgb(0_0_0/0.3)]", className)}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
            Trade
            <span className="inline-flex h-5 items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 text-[11px] font-medium text-[color-mix(in_oklab,var(--warning)_75%,var(--foreground))]">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-warning" />
              Simulated
            </span>
          </p>
          <p id={`${id}-title`} className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground">
            {market.question}
          </p>
        </div>
        {onClose ? (
          <button type="button" aria-label="Close trade ticket" onClick={onClose} className="-mt-1 -mr-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </header>

      <LayoutGroup id={`${id}-side`}>
        <div role="tablist" aria-label="Order side" className="mt-3 grid grid-cols-2 gap-0.5 rounded-full bg-surface-2 p-0.5">
          {(["buy", "sell"] as const).map((s) => (
            <button key={s} type="button" role="tab" aria-selected={side === s} onClick={() => switchSide(s)} className={cn("relative h-8 cursor-pointer rounded-full text-[13px] font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring", side === s ? "text-foreground" : "text-muted-foreground")}>
              {side === s ? <motion.span layoutId="ticket-side" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }} className="absolute inset-0 rounded-full bg-background shadow-sm" /> : null}
              <span className="relative">{s}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      {binary ? (
        <div role="radiogroup" aria-label="Outcome" className="mt-3 grid grid-cols-2 gap-2">
          {(["yes", "no"] as const).map((c) => {
            const price = c === "yes" ? market.outcomes[0].price : complement(market.outcomes[0].price);
            const active = choice === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setChoice(c)}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-between rounded-xl border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  active ? (c === "yes" ? "border-success bg-success/10 text-foreground" : "border-destructive bg-destructive/8 text-foreground") : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{c === "yes" ? "Yes" : "No"}</span>
                <span className="tabular-nums">
                  <RollingValue value={formatPrice(price)} trend={price} />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <label className="mt-3 block">
          <span className="sr-only">Outcome</span>
          <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="h-11 w-full cursor-pointer rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {market.outcomes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} · {formatPrice(o.price)}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-3">
        <TokenAmountInput
          token={side === "buy" ? USDC : shareToken}
          value={value}
          onValueChange={setAmountValue}
          balance={side === "buy" ? BigInt(balance) * BigInt(10000) : BigInt(position)}
          label={side === "buy" ? "Amount" : "Shares"}
          percentages={side === "buy" ? [] : [25, 50, 100]}
          error={over ? (side === "buy" ? "More than your balance" : "More than you hold") : undefined}
        />
        {side === "buy" ? (
          <div className="mt-2 flex gap-1.5">
            {([1, 10, 100, "max"] as const).map((chip) => (
              <button key={chip} type="button" onClick={() => addDollars(chip)} className="h-8 flex-1 cursor-pointer rounded-full border border-border text-[12px] font-medium text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring">
                {chip === "max" ? "Max" : `+$${chip}`}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {side === "buy" ? (
        <div className="mt-3 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground">
            <input type="checkbox" checked={limitMode} onChange={(event) => setLimitMode(event.target.checked)} className="size-4 accent-[var(--primary)]" />
            Limit price
          </label>
          {limitMode ? (
            <div className="flex items-center gap-1" role="group" aria-label="Limit price">
              <button type="button" aria-label="Lower limit by 1 cent" onClick={() => setLimitPrice((p) => Math.max(100, p - 100))} className="grid size-8 cursor-pointer place-items-center rounded-full border border-border outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring">
                <Minus className="size-3.5" aria-hidden="true" />
              </button>
              <span aria-live="polite" className="w-12 text-center text-sm font-medium tabular-nums">
                {formatPrice(limitPrice)}
              </span>
              <button type="button" aria-label="Raise limit by 1 cent" onClick={() => setLimitPrice((p) => Math.min(FULL - 100, p + 100))} className="grid size-8 cursor-pointer place-items-center rounded-full border border-border outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring">
                <Plus className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <dl className="mt-3 space-y-1.5 rounded-xl bg-surface p-3 text-[13px]">
        {side === "buy" ? (
          <>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Avg price</dt>
              <dd className="font-medium tabular-nums">
                <RollingValue value={`${(buyQuote.averagePrice / 100).toFixed(1)}¢`} flash={false} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Est. shares</dt>
              <dd className="font-medium tabular-nums">
                <RollingValue value={formatShares(buyQuote.shares)} flash={false} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Potential payout</dt>
              <dd className="font-medium tabular-nums">
                <RollingValue value={formatUsd(buyQuote.payout)} flash={false} />
                {amount > 0 ? <span className="ml-1.5 text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]">{formatReturn(buyQuote.returnBps)}</span> : null}
              </dd>
            </div>
          </>
        ) : (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">You receive</dt>
            <dd className="font-medium tabular-nums">
              <RollingValue value={formatUsd(sellQuote.proceeds)} flash={false} />
            </dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Price impact</dt>
          <dd className={cn("inline-flex items-center gap-1 font-medium tabular-nums", Math.abs(impact) > IMPACT_WARNING && "text-[color-mix(in_oklab,var(--warning)_80%,var(--foreground))]")}>
            {Math.abs(impact) > IMPACT_WARNING ? <TriangleAlert className="size-3.5" aria-hidden="true" /> : null}
            {(Math.abs(impact) / 100).toFixed(1)}%
            {Math.abs(impact) > IMPACT_WARNING ? <span className="sr-only"> high price impact</span> : null}
          </dd>
        </div>
      </dl>

      <div ref={scope} className="relative mt-3">
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className={cn(
            "relative flex h-11 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
            status === "success" ? "bg-success text-white" : disabled ? "bg-surface-2 text-muted-foreground" : side === "buy" && (!binary || choice === "yes") ? "bg-foreground text-background" : "bg-foreground text-background",
          )}
        >
          {status === "confirming" ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" /> : null}
          {status === "success" ? (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease: "easeOut" }} />
            </svg>
          ) : null}
          <span aria-live="polite">{action}</span>
        </button>
        {/* A small confetti burst on success. */}
        <AnimatePresence>
          {status === "success" && !reduceMotion ? (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0">
              {Array.from({ length: 14 }, (_, i) => {
                const angle = (i / 14) * Math.PI * 2;
                return (
                  <motion.span
                    key={i}
                    className="absolute top-1/2 left-1/2 size-1.5 rounded-[2px]"
                    style={{ background: ["var(--success)", "var(--primary)", "var(--warning)"][i % 3] }}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                    animate={{ x: Math.cos(angle) * (40 + (i % 3) * 18), y: Math.sin(angle) * (22 + (i % 4) * 8) - 10, opacity: 0, rotate: 180 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                );
              })}
            </span>
          ) : null}
        </AnimatePresence>
      </div>
      {status === "error" ? (
        <p role="alert" className="mt-2 text-[13px] text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]">
          Order rejected: the price moved past your limit. Try again.
        </p>
      ) : null}
      <TransactionToastStack toasts={toasts} onDismiss={(toastId) => setToasts((list) => list.filter((t) => t.id !== toastId))} dismissAfter={5000} />
    </motion.section>
  );
}
