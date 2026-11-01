"use client";

import { useEffect, useState } from "react";
import { AccountDropdown } from "@/components/ui/account-dropdown/account-dropdown";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { getMockChain, mockAccount, totalUsd } from "@/lib/web3/mock";

type Preview = "live" | "loading" | "empty";

export function Default() {
  const [preview, setPreview] = useState<Preview>("live");
  const [balance, setBalance] = useState(totalUsd());
  const [disconnected, setDisconnected] = useState(false);

  // Prices tick every 2.5s: the balance drifts by up to ±0.4% so the digits roll and flash.
  useEffect(() => {
    if (preview !== "live") return;
    let step = 0;
    const drifts = [BigInt(31), -BigInt(18), BigInt(42), -BigInt(27), BigInt(12), -BigInt(36)];
    const timer = window.setInterval(() => {
      setBalance((b) => b + (b * drifts[step++ % drifts.length]) / BigInt(10_000));
    }, 2500);
    return () => window.clearInterval(timer);
  }, [preview]);

  if (disconnected) {
    return (
      <button
        type="button"
        onClick={() => setDisconnected(false)}
        className="h-10 cursor-pointer rounded-full bg-foreground px-4 text-sm font-medium text-background"
      >
        Reconnect
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <AccountDropdown
        address={mockAccount.address}
        name={mockAccount.label}
        chain={getMockChain(1)}
        balance={preview === "empty" ? BigInt(0) : balance}
        loading={preview === "loading"}
        onDisconnect={() => setDisconnected(true)}
      />
      <DemoStateSwitcher<Preview>
        states={[
          { value: "live", label: "Live balance" },
          { value: "loading", label: "Loading" },
          { value: "empty", label: "Empty" },
        ]}
        value={preview}
        onChange={setPreview}
      />
    </div>
  );
}

export function AddressOnly() {
  return <AccountDropdown address={mockAccount.address} chain={getMockChain(8453)} balance={totalUsd()} showBalance={false} />;
}
