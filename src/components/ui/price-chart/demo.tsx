"use client";

import { useState } from "react";
import { PriceChart } from "@/components/ui/price-chart/price-chart";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { mockCandles, type MockTimeframe } from "@/lib/web3/mock";

type Preview = "chart" | "loading" | "empty";

export function Default() {
  const [timeframe, setTimeframe] = useState<MockTimeframe>("1D");
  const [preview, setPreview] = useState<Preview>("chart");
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <PriceChart
        pair="ETH/USD"
        data={preview === "empty" ? [] : mockCandles(timeframe)}
        timeframe={timeframe}
        onTimeframeChange={(tf) => setTimeframe(tf as MockTimeframe)}
        loading={preview === "loading"}
      />
      <DemoStateSwitcher<Preview> states={["chart", "loading", "empty"]} value={preview} onChange={setPreview} />
    </div>
  );
}

export function Compact() {
  const [timeframe, setTimeframe] = useState<MockTimeframe>("1W");
  return (
    <PriceChart
      className="max-w-md"
      pair="WBTC/USD"
      height={200}
      timeframes={["1D", "1W", "1M"]}
      timeframe={timeframe}
      onTimeframeChange={(tf) => setTimeframe(tf as MockTimeframe)}
      data={mockCandles(timeframe, 97234.1)}
      formatPrice={(n) => `$${Math.round(n).toLocaleString("en-US")}`}
    />
  );
}
