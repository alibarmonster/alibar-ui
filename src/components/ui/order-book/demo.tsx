"use client";

import { useEffect, useState } from "react";
import { OrderBook, type BookLevel } from "@/components/ui/order-book/order-book";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { mockOrderBook } from "@/lib/markets/mock";
import { formatPrice } from "@/lib/markets/format";

function useLiveBook(price: number, seed: number) {
  const [book, setBook] = useState(() => mockOrderBook(price, seed));
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nudge = (levels: BookLevel[]) => levels.map((l) => (Math.random() < 0.3 ? { ...l, shares: Math.max(2000, Math.round(l.shares * (0.7 + Math.random() * 0.6))) } : l));
    const id = window.setInterval(() => setBook((b) => ({ bids: nudge(b.bids), asks: nudge(b.asks) })), 1400);
    return () => window.clearInterval(id);
  }, []);
  return book;
}

export function LiveBook() {
  const book = useLiveBook(6400, 3);
  const [picked, setPicked] = useState("");
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <SimulatedBadge />
      <OrderBook bids={book.bids} asks={book.asks} onPriceSelect={(price, side, level) => setPicked(`Limit price set to ${formatPrice(price)} (${side === "yes" ? "Yes" : "No"} ${level})`)} />
      <p aria-live="polite" className="h-5 text-[12px] text-muted-foreground">
        {picked}
      </p>
    </div>
  );
}

export function ShallowBook() {
  const book = useLiveBook(2700, 9);
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <SimulatedBadge />
      <OrderBook bids={book.bids} asks={book.asks} depth={3} />
    </div>
  );
}
