"use client";

import { useEffect, useState } from "react";
import { TokenSwapWidget, type ApprovalStatus, type SwapStatus } from "@/components/ui/token-swap-widget/token-swap-widget";
import { formatUsd, toUsd } from "@/lib/web3/format";
import { gasCost, getMockToken, mockBalances, mockGasOptions, mockQuote, mockTokens, popularTokenSymbols } from "@/lib/web3/mock";

const networkFee = formatUsd(toUsd(gasCost(mockGasOptions[1]), 18, getMockToken("ETH").price));

/** The swap widget with a simulated wallet: approvals and swaps settle on timers, nothing is sent anywhere. */
export function SwapShowcase() {
  const [slippage, setSlippage] = useState(50);
  const [approval, setApproval] = useState<ApprovalStatus>("required");
  const [status, setStatus] = useState<SwapStatus>("idle");

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

  return (
    <TokenSwapWidget
      tokens={mockTokens}
      balances={mockBalances}
      popular={popularTokenSymbols}
      defaultFrom="USDC"
      defaultTo="ETH"
      defaultAmount="250"
      getQuote={(from, to, amountIn) => ({ ...mockQuote(from, to, amountIn, BigInt(slippage)), networkFee })}
      approval={approval}
      onApprove={() => setApproval("pending")}
      status={status}
      onSwap={() => setStatus("swapping")}
      slippageBps={slippage}
      onSlippageChange={setSlippage}
    />
  );
}
