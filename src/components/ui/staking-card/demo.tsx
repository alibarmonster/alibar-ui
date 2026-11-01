"use client";

import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { StakingCard, type StakingStatus } from "@/components/ui/staking-card/staking-card";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { getMockToken, mockBalances } from "@/lib/web3/mock";

const usdc = getMockToken("USDC");
type Preview = "earning" | "not staked" | "empty wallet";

export function Default() {
  const [preview, setPreview] = useState<Preview>("earning");
  const [staked, setStaked] = useState(parseUnits("12500", 6));
  const [balance, setBalance] = useState(mockBalances.USDC);
  const [rewards, setRewards] = useState(parseUnits("18.4213", 6));
  const [status, setStatus] = useState<StakingStatus>("idle");
  const [pending, setPending] = useState(BigInt(0));

  // Simulated contract: actions settle after 1.3s; "Claimed" shows for 1.4s.
  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => {
      if (status === "staking") {
        setStaked((s) => s + pending);
        setBalance((b) => b - pending);
        setStatus("idle");
      } else if (status === "unstaking") {
        setStaked((s) => s - pending);
        setBalance((b) => b + pending);
        setStatus("idle");
      } else if (status === "claiming") {
        setStatus("claimed");
      } else {
        setRewards(BigInt(0));
        setStatus("idle");
      }
    }, status === "claimed" ? 1400 : 1300);
    return () => window.clearTimeout(timer);
  }, [status, pending]);

  function show(next: Preview) {
    setPreview(next);
    setStatus("idle");
    setStaked(next === "earning" ? parseUnits("12500", 6) : BigInt(0));
    setRewards(next === "earning" ? parseUnits("18.4213", 6) : BigInt(0));
    setBalance(next === "empty wallet" ? BigInt(0) : mockBalances.USDC);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <StakingCard
        token={usdc}
        apyBps={840}
        staked={staked}
        balance={balance}
        rewards={rewards}
        status={status}
        onStake={(amount) => {
          setPending(amount);
          setStatus("staking");
        }}
        onUnstake={(amount) => {
          setPending(amount);
          setStatus("unstaking");
        }}
        onClaim={() => setStatus("claiming")}
      />
      <DemoStateSwitcher<Preview> states={["earning", "not staked", "empty wallet"]} value={preview} onChange={show} />
    </div>
  );
}
