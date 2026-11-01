"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";
import { useAnimate, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { formatUnits } from "viem";
import { cn } from "@/lib/utils";
import { formatAmount, formatUsd, parseAmount, percentOf, toUsd } from "@/lib/web3/format";
import { TokenIcon } from "@/lib/web3/icons";
import type { Token } from "@/lib/web3/types";

export interface TokenAmountInputProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** The selected token. Its `price` powers the USD line. */
  token?: Token;
  /** Raw input text (controlled), e.g. "1.25". */
  value: string;
  /** Called with the cleaned text and the parsed amount (null when empty or invalid). */
  onValueChange?: (value: string, amount: bigint | null) => void;
  /** Wallet balance in the token's smallest unit. Enables the chips and the balance check. */
  balance?: bigint;
  /** Label above the field. @default "Amount" */
  label?: string;
  /** Percentage chips; 100 shows as "Max". Pass [] to hide them. @default [25, 50, 75, 100] */
  percentages?: number[];
  /** Called when the token button is pressed (open a token selector here). Without it the token is static. */
  onTokenClick?: () => void;
  /** Read-only output field, e.g. "You receive". @default false */
  readOnly?: boolean;
  /** Shimmer the value while it loads, e.g. while fetching a quote. @default false */
  loading?: boolean;
  /** Error text that overrides the built-in balance check. */
  error?: string;
  /** Disables the field and chips. @default false */
  disabled?: boolean;
}

const sanitize = (text: string, decimals: number) => {
  const cleaned = text.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [integer, ...rest] = cleaned.split(".");
  if (rest.length === 0) return integer.replace(/^0+(?=\d)/, "");
  return `${integer.replace(/^0+(?=\d)/, "") || "0"}.${rest.join("").slice(0, decimals)}`;
};

export function TokenAmountInput({
  token,
  value,
  onValueChange,
  balance,
  label = "Amount",
  percentages = [25, 50, 75, 100],
  onTokenClick,
  readOnly = false,
  loading = false,
  error,
  disabled = false,
  className,
  ...props
}: TokenAmountInputProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const decimals = token?.decimals ?? 18;
  const amount = parseAmount(value, decimals);
  const insufficient = !readOnly && balance !== undefined && amount !== null && amount > balance;
  const message = error ?? (insufficient ? `Insufficient ${token?.symbol ?? ""} balance`.trim() : undefined);
  const usd = amount !== null && token?.price !== undefined ? toUsd(amount, decimals, token.price) : undefined;

  // Count each transition into the error state; the count keys the shake.
  const [wasInvalid, setWasInvalid] = useState(Boolean(message));
  const [shakes, setShakes] = useState(0);
  if (Boolean(message) !== wasInvalid) {
    setWasInvalid(Boolean(message));
    if (message) setShakes(shakes + 1);
  }
  const [scope, animate] = useAnimate<HTMLDivElement>();
  useEffect(() => {
    if (shakes === 0 || reduceMotion || !scope.current) return;
    animate(scope.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.4, ease: "easeInOut" });
  }, [shakes, reduceMotion, animate, scope]);

  const set = (text: string) => {
    const next = sanitize(text, decimals);
    onValueChange?.(next, parseAmount(next, decimals));
  };

  const tokenButton = token ? (
    <>
      <TokenIcon token={token} size={24} />
      <span className="font-semibold">
        {onTokenClick ? <span className="sr-only">Change token, </span> : null}
        {token.symbol}
        {onTokenClick ? <span className="sr-only"> selected</span> : null}
      </span>
    </>
  ) : (
    <span className="px-1 font-medium">Select token</span>
  );

  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface p-4 transition-colors focus-within:bg-background",
        message ? "border-destructive/40" : "border-border focus-within:border-ring/50",
        disabled && "opacity-60",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] text-muted-foreground">
          {label}
        </label>
        {balance !== undefined && token ? (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            Balance {formatAmount(balance, decimals)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div ref={scope} className="relative min-w-0 flex-1">
          <input
            id={id}
            value={value}
            onChange={(event) => set(event.target.value)}
            readOnly={readOnly}
            disabled={disabled}
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="0"
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? `${id}-error` : `${id}-usd`}
            aria-busy={loading || undefined}
            className={cn(
              "w-full min-w-0 bg-transparent font-mono text-[28px] leading-10 font-semibold tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/50",
              message ? "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]" : "text-foreground",
              loading && "text-transparent",
              readOnly && "cursor-default",
            )}
          />
          {loading ? (
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-0 h-7 w-32 -translate-y-1/2 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
            />
          ) : null}
        </div>
        {onTokenClick ? (
          <button
            type="button"
            onClick={onTokenClick}
            disabled={disabled}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border bg-background py-1 pr-2.5 pl-1.5 text-sm text-foreground shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            {tokenButton}
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          </button>
        ) : (
          <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-background py-1 pr-3 pl-1.5 text-sm text-foreground">
            {tokenButton}
          </span>
        )}
      </div>
      <div className="mt-2 flex min-h-8 flex-wrap items-center justify-between gap-2">
        {message ? (
          <p id={`${id}-error`} role="alert" className="text-xs font-medium text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]">
            {message}
          </p>
        ) : (
          <p id={`${id}-usd`} className="font-mono text-xs text-muted-foreground tabular-nums">
            {usd !== undefined ? `≈ ${formatUsd(usd)}` : token?.price !== undefined ? "≈ $0.00" : ""}
          </p>
        )}
        {!readOnly && balance !== undefined && percentages.length > 0 ? (
          <div className="flex gap-1">
            {percentages.map((pct) => {
              const target = pct >= 100 ? balance : percentOf(balance, pct);
              const active = amount !== null && amount === target && target > BigInt(0);
              return (
                <button
                  key={pct}
                  type="button"
                  disabled={disabled || balance === BigInt(0)}
                  onClick={() => set(formatUnits(target, decimals))}
                  aria-pressed={active}
                  className={cn(
                    "relative h-7 cursor-pointer rounded-full border px-2.5 font-mono text-[11px] font-medium tabular-nums outline-none transition-colors after:absolute after:-inset-1 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    active ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {pct >= 100 ? "Max" : `${pct}%`}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
