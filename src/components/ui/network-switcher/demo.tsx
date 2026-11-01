"use client";

import { useEffect, useState } from "react";
import { NetworkSwitcher } from "@/components/ui/network-switcher/network-switcher";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { mockChains } from "@/lib/web3/mock";

type Preview = "connected" | "switching" | "wrong" | "rejected";
const UNSUPPORTED_CHAIN = 59144;

export function Default() {
  const [chainId, setChainId] = useState(mockChains[0].id);
  const [switchingTo, setSwitchingTo] = useState<number>();
  const [error, setError] = useState<string>();
  const [simulate, setSimulate] = useState(true);

  // A switch request "confirms" in the wallet after 1.2s.
  useEffect(() => {
    if (switchingTo === undefined || !simulate) return;
    const timer = window.setTimeout(() => {
      setChainId(switchingTo);
      setSwitchingTo(undefined);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [switchingTo, simulate]);

  const preview: Preview =
    switchingTo !== undefined ? "switching" : error ? "rejected" : mockChains.some((c) => c.id === chainId) ? "connected" : "wrong";

  function show(next: Preview) {
    setSimulate(false);
    setError(next === "rejected" ? "The switch was rejected in your wallet." : undefined);
    setSwitchingTo(next === "switching" ? mockChains[1].id : undefined);
    setChainId(next === "wrong" || next === "rejected" ? UNSUPPORTED_CHAIN : mockChains[0].id);
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <NetworkSwitcher
        className="w-full items-center"
        chains={mockChains}
        chainId={chainId}
        switchingTo={switchingTo}
        error={error}
        unsupportedChainName="Linea"
        onSwitch={(id) => {
          setError(undefined);
          setSimulate(true);
          setSwitchingTo(id);
        }}
      />
      <DemoStateSwitcher<Preview>
        states={[
          { value: "connected", label: "Connected" },
          { value: "switching", label: "Switching" },
          { value: "wrong", label: "Wrong network" },
          { value: "rejected", label: "Rejected" },
        ]}
        value={preview}
        onChange={show}
      />
    </div>
  );
}

export function InHeader() {
  const [chainId, setChainId] = useState(mockChains[1].id);
  return (
    <div className="w-full max-w-xl rounded-xl border border-border bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold text-foreground">Bridge</span>
        <NetworkSwitcher chains={mockChains} chainId={chainId} onSwitch={setChainId} showBanner={false} />
      </div>
      <p className="px-4 py-5 text-[13px] text-muted-foreground">Pick a network: the trigger updates instantly here, with no wallet in the loop.</p>
    </div>
  );
}
