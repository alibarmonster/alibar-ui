"use client";

import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { TransactionReviewModal } from "@/components/ui/transaction-review-modal/transaction-review-modal";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { formatAmount, formatBps, formatUsd, toUsd } from "@/lib/web3/format";
import type { TxStatus } from "@/lib/web3/types";
import { gasCost, getMockChain, getMockToken, mockGasOptions, mockQuote, mockTxHash } from "@/lib/web3/mock";

const eth = getMockToken("ETH");
const usdc = getMockToken("USDC");
const amountIn = parseUnits("0.5", 18);
const quote = mockQuote(eth, usdc, amountIn);
const fee = gasCost(mockGasOptions[1]);
const feeUsd = toUsd(fee, 18, eth.price);

const trigger = (
  <button
    type="button"
    className="inline-flex h-10 cursor-pointer items-center rounded-full bg-foreground px-5 text-sm font-medium text-background outline-none hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    Review swap
  </button>
);

const STATES: { value: TxStatus; label: string }[] = [
  { value: "idle", label: "Review" },
  { value: "awaiting-signature", label: "Signing" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "failed", label: "Failed" },
];

export function Default() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [simulate, setSimulate] = useState(false);

  // After the hold: 1.5s waiting for the signature, 2s pending, then confirmed.
  useEffect(() => {
    if (!simulate) return;
    const next: Partial<Record<TxStatus, [TxStatus, number]>> = { "awaiting-signature": ["pending", 1500], pending: ["confirmed", 2000] };
    const step = next[status];
    if (!step) return;
    const timer = window.setTimeout(() => setStatus(step[0]), step[1]);
    return () => window.clearTimeout(timer);
  }, [status, simulate]);

  return (
    <div className="flex flex-col items-center gap-6">
      <TransactionReviewModal
        trigger={trigger}
        title="Review swap"
        status={status}
        onOpenChange={(open) => {
          if (!open && (status === "confirmed" || status === "failed")) setStatus("idle");
        }}
        onConfirm={() => {
          setSimulate(true);
          setStatus("awaiting-signature");
        }}
        onRetry={() => setStatus("idle")}
        assets={[
          { label: "You pay", token: eth, amount: amountIn, usd: toUsd(amountIn, 18, eth.price) },
          { label: "You receive", token: usdc, amount: quote.amountOut, usd: toUsd(quote.amountOut, 6, usdc.price) },
        ]}
        details={[
          { label: "Rate", value: `1 ETH = ${formatAmount(quote.rate, 6, { maxFractionDigits: 2 })} USDC` },
          { label: "Price impact", value: formatBps(quote.priceImpactBps) },
          { label: "Network fee", value: `${formatAmount(fee, 18, { maxFractionDigits: 5 })} ETH (${formatUsd(feeUsd)})` },
          { label: "Minimum received", value: `${formatAmount(quote.minimumOut, 6, { maxFractionDigits: 2 })} USDC`, emphasis: true },
        ]}
        txHash={mockTxHash("review")}
        explorerUrl={getMockChain(1).explorerUrl}
        error="Swap reverted: the price moved beyond your 0.5% slippage."
      />
      <p className="text-[13px] text-muted-foreground">Pick a state, then open the dialog. Holding the button runs the whole flow.</p>
      <DemoStateSwitcher<TxStatus>
        states={STATES}
        value={status}
        onChange={(next) => {
          setSimulate(false);
          setStatus(next);
        }}
      />
    </div>
  );
}

export function WithWarning() {
  const big = parseUnits("300", 18);
  const q = mockQuote(eth, usdc, big);
  return (
    <TransactionReviewModal
      trigger={trigger}
      title="Review swap"
      onConfirm={() => {}}
      assets={[
        { label: "You pay", token: eth, amount: big, usd: toUsd(big, 18, eth.price) },
        { label: "You receive", token: usdc, amount: q.amountOut, usd: toUsd(q.amountOut, 6, usdc.price) },
      ]}
      details={[
        { label: "Price impact", value: formatBps(q.priceImpactBps) },
        { label: "Minimum received", value: `${formatAmount(q.minimumOut, 6, { maxFractionDigits: 0 })} USDC`, emphasis: true },
      ]}
      warning={
        <>
          <strong className="font-medium">High price impact ({formatBps(q.priceImpactBps)}).</strong> You may receive far less than the market
          rate. Consider a smaller amount.
        </>
      }
    />
  );
}
