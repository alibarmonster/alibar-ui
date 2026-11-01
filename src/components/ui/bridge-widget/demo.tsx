"use client";

import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { BridgeWidget, type BridgeQuote, type BridgeStatus } from "@/components/ui/bridge-widget/bridge-widget";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { formatAmount } from "@/lib/web3/format";
import type { Chain } from "@/lib/web3/types";
import { getMockToken, mockChains, mockTxHash } from "@/lib/web3/mock";

const eth = getMockToken("ETH");
const chains = mockChains.slice(0, 4);
const BALANCES: Record<number, bigint> = { [chains[0].id]: parseUnits("2.481532", 18), [chains[1].id]: parseUnits("0.35", 18), [chains[2].id]: parseUnits("0.12", 18), [chains[3].id]: BigInt(0) };

/** 0.05% bridge fee plus a fixed relayer fee; leaving Ethereum is slower than arriving. */
function quote(from: Chain, _to: Chain, amount: bigint): BridgeQuote | null {
  const relayer = parseUnits("0.0004", 18);
  const fee = (amount * BigInt(5)) / BigInt(10000) + relayer;
  if (amount <= fee) return null;
  return {
    receive: amount - fee,
    etaSeconds: from.id === 1 ? 720 : 90,
    fees: [
      { label: "Bridge fee (0.05%)", value: `${formatAmount((amount * BigInt(5)) / BigInt(10000), 18, { maxFractionDigits: 6 })} ETH` },
      { label: "Relayer fee", value: `${formatAmount(relayer, 18)} ETH` },
      { label: `Gas on ${from.shortName ?? from.name}`, value: "≈ $2.84" },
    ],
  };
}

type Preview = "form" | "awaiting-signature" | "bridging" | "complete" | "failed";

export function Default() {
  const [status, setStatus] = useState<BridgeStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [simulate, setSimulate] = useState(false);

  useEffect(() => {
    if (!simulate) return;
    if (status === "awaiting-signature" || status === "sending") {
      const timer = window.setTimeout(() => setStatus(status === "awaiting-signature" ? "sending" : "bridging"), 1300);
      return () => window.clearTimeout(timer);
    }
    if (status === "bridging") {
      const timer = window.setInterval(() => {
        setProgress((p) => {
          if (p >= 0.95) {
            setStatus("complete");
            return 1;
          }
          return p + 0.15;
        });
      }, 600);
      return () => window.clearInterval(timer);
    }
  }, [status, simulate]);

  const preview: Preview = status === "idle" ? "form" : status === "sending" ? "awaiting-signature" : status;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <BridgeWidget
        chains={chains}
        token={eth}
        balances={BALANCES}
        defaultAmount="0.8"
        getQuote={quote}
        status={status}
        progress={progress}
        txHash={mockTxHash("bridge")}
        onBridge={() => {
          setProgress(0);
          setSimulate(true);
          setStatus("awaiting-signature");
        }}
        onReset={() => {
          setSimulate(false);
          setStatus("idle");
        }}
        error="The relayer didn't pick up the transfer. Your funds are still on Ethereum."
      />
      <DemoStateSwitcher<Preview>
        states={[
          { value: "form", label: "Form" },
          { value: "awaiting-signature", label: "Signing" },
          { value: "bridging", label: "Bridging" },
          { value: "complete", label: "Complete" },
          { value: "failed", label: "Failed" },
        ]}
        value={preview}
        onChange={(next) => {
          setSimulate(false);
          setProgress(next === "bridging" ? 0.45 : next === "complete" ? 1 : 0);
          setStatus(next === "form" ? "idle" : next);
        }}
      />
    </div>
  );
}
