"use client";

import { useEffect, useState } from "react";
import { TokenSwapWidget, type ApprovalStatus, type SwapStatus } from "@/components/ui/token-swap-widget/token-swap-widget";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { formatUsd, toUsd } from "@/lib/web3/format";
import { gasCost, getMockToken, mockBalances, mockGasOptions, mockQuote, mockTokens, popularTokenSymbols } from "@/lib/web3/mock";

type Preview = "ready" | "fetching" | "approve" | "high impact" | "insufficient";

const PRESETS: Record<Preview, { from: string; to: string; amount: string; approval: ApprovalStatus; loading?: boolean }> = {
  ready: { from: "ETH", to: "USDC", amount: "0.5", approval: "approved" },
  fetching: { from: "ETH", to: "USDC", amount: "0.5", approval: "approved", loading: true },
  approve: { from: "USDC", to: "ETH", amount: "250", approval: "required" },
  "high impact": { from: "WBTC", to: "USDC", amount: "0.04", approval: "approved" },
  insufficient: { from: "ETH", to: "USDC", amount: "12", approval: "approved" },
};

const networkFee = formatUsd(toUsd(gasCost(mockGasOptions[1]), 18, getMockToken("ETH").price));

export function Default() {
  const [preview, setPreview] = useState<Preview>("ready");
  const [slippage, setSlippage] = useState(50);
  const [approval, setApproval] = useState<ApprovalStatus>("approved");
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [loading, setLoading] = useState(false);
  const preset = PRESETS[preview];

  // Simulated wallet: approvals take 1.2s, swaps 1.6s, and "Swapped" shows for 1.4s.
  useEffect(() => {
    if (approval !== "pending") return;
    const timer = window.setTimeout(() => setApproval("approved"), 1200);
    return () => window.clearTimeout(timer);
  }, [approval]);
  useEffect(() => {
    if (status === "idle" || status === "failed") return;
    const timer = window.setTimeout(() => setStatus(status === "swapping" ? "success" : "idle"), status === "swapping" ? 1600 : 1400);
    return () => window.clearTimeout(timer);
  }, [status]);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, [loading]);

  // The high-impact preset pretends liquidity is thin, so the quote shows a large impact.
  const thinLiquidity = preview === "high impact";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <TokenSwapWidget
        key={preview}
        tokens={mockTokens}
        balances={mockBalances}
        popular={popularTokenSymbols}
        defaultFrom={preset.from}
        defaultTo={preset.to}
        defaultAmount={preset.amount}
        getQuote={(from, to, amountIn) => {
          const quote = mockQuote(from, to, thinLiquidity ? amountIn * BigInt(400) : amountIn, BigInt(slippage));
          return { ...(thinLiquidity ? { ...quote, amountOut: quote.amountOut / BigInt(400), minimumOut: quote.minimumOut / BigInt(400) } : quote), networkFee };
        }}
        quoteLoading={preset.loading || loading}
        onQuoteRefresh={() => setLoading(true)}
        approval={approval}
        onApprove={() => setApproval("pending")}
        status={status}
        onSwap={() => setStatus("swapping")}
        slippageBps={slippage}
        onSlippageChange={setSlippage}
      />
      <DemoStateSwitcher<Preview>
        states={["ready", "fetching", "approve", "high impact", "insufficient"]}
        value={preview}
        onChange={(next) => {
          setPreview(next);
          setApproval(PRESETS[next].approval);
          setStatus("idle");
        }}
      />
    </div>
  );
}
