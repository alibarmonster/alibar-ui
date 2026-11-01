"use client";

import { useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";
import { formatAmount, formatPercent, formatUsd, toUsd, USD_DECIMALS } from "@/lib/web3/format";
import { TokenIcon } from "@/lib/web3/icons";
import type { Token } from "@/lib/web3/types";

export interface TokenBalance {
  token: Token;
  /** Balance in the token's smallest unit. */
  balance: bigint;
  /** 24h price change as a ratio: 0.0214 is +2.14%. */
  change24h?: number;
}

export interface TokenBalanceListProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Balances to list. Rows are sorted by USD value. */
  items: TokenBalance[];
  /** Controlled "hide small balances" toggle. */
  hideSmallBalances?: boolean;
  /** Initial toggle state when uncontrolled. @default false */
  defaultHideSmallBalances?: boolean;
  /** Called when the toggle changes. */
  onHideSmallBalancesChange?: (hide: boolean) => void;
  /** USD value (8 decimals) under which a balance counts as small. @default $1 */
  smallBalanceThreshold?: bigint;
  /** Show skeleton rows. @default false */
  loading?: boolean;
  /** Heading above the list. @default "Tokens" */
  title?: string;
  /** Message when there's nothing to show. @default "No tokens in this wallet yet." */
  emptyMessage?: string;
}

const usdOf = (item: TokenBalance) => (item.token.price === undefined ? BigInt(0) : toUsd(item.balance, item.token.decimals, item.token.price));

function Change({ value }: { value: number }) {
  const up = value > 0;
  const down = value < 0;
  const Icon = down ? TrendingDown : TrendingUp;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs tabular-nums",
        up && "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]",
        down && "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]",
        !up && !down && "text-muted-foreground",
      )}
    >
      {up || down ? <Icon className="size-3" aria-hidden="true" /> : null}
      {formatPercent(value, { signed: true })}
      <span className="sr-only"> in 24 hours</span>
    </span>
  );
}

export function TokenBalanceList({
  items,
  hideSmallBalances,
  defaultHideSmallBalances = false,
  onHideSmallBalancesChange,
  smallBalanceThreshold = BigInt(10) ** BigInt(USD_DECIMALS),
  loading = false,
  title = "Tokens",
  emptyMessage = "No tokens in this wallet yet.",
  className,
  ...props
}: TokenBalanceListProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [internalHide, setInternalHide] = useState(defaultHideSmallBalances);
  const hide = hideSmallBalances ?? internalHide;
  const setHide = (next: boolean) => {
    if (hideSmallBalances === undefined) setInternalHide(next);
    onHideSmallBalancesChange?.(next);
  };

  const sorted = [...items].sort((a, b) => {
    const diff = usdOf(b) - usdOf(a);
    return diff > BigInt(0) ? 1 : diff < BigInt(0) ? -1 : 0;
  });
  const small = sorted.filter((item) => usdOf(item) < smallBalanceThreshold);
  const visible = hide ? sorted.filter((item) => usdOf(item) >= smallBalanceThreshold) : sorted;
  const total = sorted.reduce((sum, item) => sum + usdOf(item), BigInt(0));

  const rowEnter = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 8, filter: "blur(4px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)" } };

  return (
    <div className={cn("w-full max-w-md rounded-2xl border border-border bg-background shadow-sm", className)} {...props}>
      <div className="flex items-end justify-between gap-4 border-b border-border px-4 pt-4 pb-3">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 font-mono text-xl font-semibold tracking-tight text-foreground tabular-nums">
            {loading ? <span className="inline-block h-5 w-28 animate-pulse rounded bg-muted align-middle motion-reduce:animate-none" /> : formatUsd(total)}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hide}
          onClick={() => setHide(!hide)}
          disabled={loading || items.length === 0}
          className="group inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <span>
            Hide small balances
            {small.length > 0 && hide ? <span className="ml-1 font-mono text-xs tabular-nums">({small.length})</span> : null}
          </span>
          <span
            aria-hidden="true"
            className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors", hide ? "bg-foreground" : "bg-muted-foreground/30")}
          >
            <motion.span
              className="size-4 rounded-full bg-background shadow-sm"
              animate={{ x: hide ? 16 : 0 }}
              transition={reduceMotion ? { duration: 0 } : spring.snappy}
            />
          </span>
        </button>
      </div>

      {loading ? (
        <ul aria-busy="true" aria-label="Loading tokens" className="divide-y divide-border">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="size-9 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
              <span className="flex-1 space-y-1.5">
                <span className="block h-3 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                <span className="block h-2.5 w-16 animate-pulse rounded bg-muted motion-reduce:animate-none" />
              </span>
              <span className="h-3 w-16 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            </li>
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-foreground">{items.length === 0 ? emptyMessage : "All balances are hidden."}</p>
          {items.length > 0 ? <p className="mt-1 text-[13px] text-muted-foreground">Turn off &ldquo;Hide small balances&rdquo; to see them.</p> : null}
        </div>
      ) : (
        <motion.ul
          className="divide-y divide-border"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.045 } } }}
        >
          <AnimatePresence mode="popLayout">
            {visible.map((item) => {
              const usd = usdOf(item);
              return (
                <motion.li
                  key={item.token.symbol + (item.token.address ?? "")}
                  layout={reduceMotion ? false : "position"}
                  variants={rowEnter}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                  transition={{ duration: duration.base, ease: ease.out, layout: spring.smooth }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <TokenIcon token={item.token} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.token.name ?? item.token.symbol}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground tabular-nums">
                      {formatAmount(item.balance, item.token.decimals)} {item.token.symbol}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-foreground tabular-nums">
                      {item.token.price === undefined ? "—" : formatUsd(usd)}
                    </p>
                    {item.change24h !== undefined ? <Change value={item.change24h} /> : null}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
