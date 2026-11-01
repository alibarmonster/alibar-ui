"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatPrice, formatShares, formatUsd } from "@/lib/markets/format";
import { FULL, valueOf } from "@/lib/markets/math";

export interface BookLevel {
  /** Price in basis points. */
  price: number;
  /** Shares at this price, in hundredths. */
  shares: number;
}

export interface OrderBookProps {
  /** Bids for Yes, best (highest) first. */
  bids: BookLevel[];
  /** Asks for Yes, best (lowest) first. */
  asks: BookLevel[];
  /** Fires when a price is clicked, e.g. to fill a Trade Ticket's limit price. */
  onPriceSelect?: (price: number, book: "yes" | "no", side: "bid" | "ask") => void;
  /** Rows per side. @default 6 */
  depth?: number;
  /** Classes for the root. */
  className?: string;
}

function Row({ level, side, max, onSelect }: { level: BookLevel & { total: number }; side: "bid" | "ask"; max: number; onSelect: () => void }) {
  const reduceMotion = useReducedMotion();
  const last = useRef(level.shares);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (level.shares === last.current) return;
    const direction = level.shares > last.current ? "up" : "down";
    last.current = level.shares;
    const on = window.setTimeout(() => setFlash(direction), 0);
    const off = window.setTimeout(() => setFlash(null), 600);
    return () => {
      window.clearTimeout(on);
      window.clearTimeout(off);
    };
  }, [level.shares]);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn("relative grid w-full cursor-pointer grid-cols-3 px-3 py-1 text-[12px] tabular-nums outline-none transition-colors duration-500 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", flash === "up" && "bg-success/10", flash === "down" && "bg-destructive/10")}
      >
        <motion.span
          aria-hidden="true"
          className={cn("absolute inset-y-0.5 right-0 w-full origin-right rounded-l-sm", side === "bid" ? "bg-success/12" : "bg-destructive/10")}
          initial={false}
          animate={{ scaleX: Math.min(1, level.total / Math.max(1, max)) }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 28 }}
        />
        <span className={cn("relative text-left font-medium", side === "bid" ? "text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]" : "text-[color-mix(in_oklab,var(--destructive)_75%,var(--foreground))]")}><span className="sr-only">{side === "bid" ? "Bid " : "Ask "}</span>
          {formatPrice(level.price)}
        </span>
        <span className="relative text-right text-foreground">
          {formatShares(level.shares)}
          <span className="sr-only"> shares, total</span>
        </span>
        <span className="relative text-right text-[color-mix(in_oklab,var(--muted-foreground)_70%,var(--foreground))]">
          {formatUsd(level.total, true)}
          <span className="sr-only">. Use as limit price</span>
        </span>
      </button>
    </li>
  );
}

/**
 * A prediction market order book: asks above, bids below, depth bars that grow with the running
 * total, the spread in between, a Yes/No toggle, flashing rows on size changes and click-to-fill.
 */
export function OrderBook({ bids, asks, onPriceSelect, depth = 6, className }: OrderBookProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [book, setBook] = useState<"yes" | "no">("yes");
  // The No book mirrors Yes: a Yes bid at p is a No ask at 100 − p.
  const mirror = (levels: BookLevel[]) => levels.map((l) => ({ price: FULL - l.price, shares: l.shares }));
  const sideBids = (book === "yes" ? bids : mirror(asks)).slice(0, depth);
  const sideAsks = (book === "yes" ? asks : mirror(bids)).slice(0, depth);
  const withTotals = (levels: BookLevel[]) => {
    let running = 0;
    return levels.map((l) => {
      running += valueOf(l.shares, l.price);
      return { ...l, total: running };
    });
  };
  const bidRows = withTotals(sideBids);
  const askRows = withTotals(sideAsks);
  const max = Math.max(bidRows[bidRows.length - 1]?.total ?? 0, askRows[askRows.length - 1]?.total ?? 0);
  const spread = sideAsks[0] && sideBids[0] ? sideAsks[0].price - sideBids[0].price : 0;

  return (
    <section aria-label="Order book" className={cn("w-full rounded-2xl border border-border bg-background py-2", className)}>
      <div className="flex items-center justify-between px-3 pb-2">
        <p className="text-sm font-medium text-foreground">Order book</p>
        <LayoutGroup id={id}>
          <div role="radiogroup" aria-label="Book" className="flex rounded-full bg-surface-2 p-0.5">
            {(["yes", "no"] as const).map((b) => (
              <button key={b} type="button" role="radio" aria-checked={book === b} onClick={() => setBook(b)} className={cn("relative h-7 cursor-pointer rounded-full px-3 text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", book === b ? "text-foreground" : "text-[color-mix(in_oklab,var(--muted-foreground)_75%,var(--foreground))]")}>
                {book === b ? <motion.span layoutId="book-pill" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }} className="absolute inset-0 rounded-full bg-background shadow-sm" /> : null}
                <span className="relative">Trade {b === "yes" ? "Yes" : "No"}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>
      <div className="grid grid-cols-3 px-3 pb-1 text-[11px] text-muted-foreground">
        <span>Price</span>
        <span className="text-right">Shares</span>
        <span className="text-right">Total</span>
      </div>
      <ul aria-label="Asks" className="flex flex-col-reverse">
        {askRows.map((level) => (
          <Row key={`a-${level.price}`} level={level} side="ask" max={max} onSelect={() => onPriceSelect?.(level.price, book, "ask")} />
        ))}
      </ul>
      <p className="my-1 flex items-center justify-between border-y border-border bg-surface px-3 py-1.5 text-[12px] text-muted-foreground">
        <span>Spread</span>
        <span className="font-medium text-foreground tabular-nums">{formatPrice(spread)}</span>
      </p>
      <ul aria-label="Bids">
        {bidRows.map((level) => (
          <Row key={`b-${level.price}`} level={level} side="bid" max={max} onSelect={() => onPriceSelect?.(level.price, book, "bid")} />
        ))}
      </ul>
    </section>
  );
}
