"use client";

import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { LiquidityPoolCard, type LiquidityStatus } from "@/components/ui/liquidity-pool-card/liquidity-pool-card";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { getMockToken } from "@/lib/web3/mock";

const eth = getMockToken("ETH");
const usdc = getMockToken("USDC");
const PRICE = 3412.58;
type Preview = "in range" | "narrow" | "out of range";
const RANGES: Record<Preview, [number, number]> = {
  "in range": [PRICE * 0.8, PRICE * 1.2],
  narrow: [PRICE * 0.97, PRICE * 1.03],
  "out of range": [PRICE * 1.1, PRICE * 1.35],
};

export function Default() {
  const [preview, setPreview] = useState<Preview>("in range");
  const [range, setRange] = useState<[number, number]>(RANGES["in range"]);
  const [status, setStatus] = useState<LiquidityStatus>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus(status === "adding" ? "added" : "idle"), status === "adding" ? 1400 : 1600);
    return () => window.clearTimeout(timer);
  }, [status]);

  return (
    <div className="flex flex-col items-center gap-6">
      <LiquidityPoolCard
        tokenA={eth}
        tokenB={usdc}
        feeBps={30}
        tvl={parseUnits("184250000", 8)}
        volume24h={parseUnits("42800000", 8)}
        aprBps={1240}
        price={PRICE}
        range={range}
        onRangeChange={setRange}
        defaultExpanded
        status={status}
        onAddLiquidity={() => setStatus("adding")}
      />
      <DemoStateSwitcher<Preview>
        states={["in range", "narrow", "out of range"]}
        value={preview}
        onChange={(next) => {
          setPreview(next);
          setRange(RANGES[next]);
        }}
      />
    </div>
  );
}

export function Collapsed() {
  return (
    <LiquidityPoolCard
      tokenA={getMockToken("WBTC")}
      tokenB={eth}
      feeBps={5}
      tvl={parseUnits("62100000", 8)}
      volume24h={parseUnits("9300000", 8)}
      aprBps={610}
      price={28.49}
      formatPrice={(n) => n.toFixed(3)}
    />
  );
}
