"use client";

import { useRef } from "react";
import { MobileTradeBar } from "@/components/ui/mobile-trade-bar/mobile-trade-bar";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { formatUsd } from "@/lib/markets/format";
import { getMockMarket, useMockMarketFeed } from "@/lib/markets/mock";
import type { Market } from "@/lib/markets/types";

function Phone({ market }: { market: Market }) {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <SimulatedBadge />
      <div className="relative h-[560px] w-[320px] max-w-full overflow-hidden rounded-[32px] border border-border bg-background shadow-[0_24px_60px_-30px_rgb(0_0_0/0.35)]">
        <div ref={scroller} tabIndex={0} aria-label="Market page (scroll to hide the bar)" className="h-full overflow-y-auto px-4 pt-6 pb-28 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{market.topic}</p>
          <p className="mt-1 text-lg leading-6 font-semibold text-foreground">{market.question}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">{formatUsd(market.volume, true)} volume · {market.traders.toLocaleString("en-US")} traders</p>
          <div aria-hidden="true" className="mt-4 h-36 rounded-xl bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]" />
          {["About", "Rules", "Recent activity", "Discussion"].map((title) => (
            <section key={title} className="mt-5">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="mt-1 text-[13px] leading-6 text-muted-foreground">Placeholder copy for the market page. Scroll down and the trade bar slides away; scroll up and it returns. Tap Yes or No to open the trade sheet.</p>
            </section>
          ))}
        </div>
        <MobileTradeBar market={market} scrollContainer={scroller} contained />
      </div>
    </div>
  );
}

export function Binary() {
  const market = useMockMarketFeed([getMockMarket("glass-phone")])[0];
  return <Phone market={market} />;
}

export function MultiOutcome() {
  const market = useMockMarketFeed([getMockMarket("film-award")])[0];
  return <Phone market={market} />;
}
