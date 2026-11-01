"use client";

import { useEffect, useState } from "react";
import { PriceTicker, type TickerItem } from "@/components/ui/price-ticker/price-ticker";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { mockTokens } from "@/lib/web3/mock";

const BASE: TickerItem[] = mockTokens
  .filter((t) => !["USDC", "USDT", "DAI"].includes(t.symbol))
  .map((t) => ({ label: `${t.symbol}/USD`, token: t, price: t.price, change24h: t.change24h }));

// Deterministic tick pattern in basis points, applied to one pair at a time.
const TICKS = [12, -9, 21, -15, 6, -4, 17, -11];

export function Default() {
  const [items, setItems] = useState(BASE);
  const [live, setLive] = useState<"live" | "paused">("live");

  useEffect(() => {
    if (live !== "live") return;
    let step = 0;
    const timer = window.setInterval(() => {
      const index = step % BASE.length;
      const bps = BigInt(TICKS[step % TICKS.length]);
      step += 1;
      setItems((list) => list.map((item, i) => (i === index ? { ...item, price: item.price + (item.price * bps) / BigInt(10000) } : item)));
    }, 900);
    return () => window.clearInterval(timer);
  }, [live]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <PriceTicker items={items} />
      <DemoStateSwitcher states={["live", "paused"]} value={live} onChange={setLive} label="Price updates" />
    </div>
  );
}

export function Reverse() {
  return <PriceTicker items={BASE.slice(0, 6)} direction="right" speed={24} className="rounded-xl border-x" />;
}
