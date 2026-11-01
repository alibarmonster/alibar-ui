"use client";

import { useEffect, useState } from "react";
import { GasFeeSelector, type GasOption } from "@/components/ui/gas-fee-selector/gas-fee-selector";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { getMockToken, mockGasOptions } from "@/lib/web3/mock";

type Preview = "live" | "paused" | "congested";
const DRIFT = [BigInt(104), BigInt(97), BigInt(108), BigInt(95), BigInt(101), BigInt(99)];

export function Default() {
  const [preview, setPreview] = useState<Preview>("live");
  const [options, setOptions] = useState<GasOption[]>(mockGasOptions);

  // Gas prices drift every 3s while live (±8%), so costs roll and flash.
  useEffect(() => {
    if (preview !== "live") return;
    let step = 0;
    const timer = window.setInterval(() => {
      const factor = DRIFT[step++ % DRIFT.length];
      setOptions((list) => list.map((o) => ({ ...o, maxFeePerGas: (o.maxFeePerGas * factor) / BigInt(100) })));
    }, 3000);
    return () => window.clearInterval(timer);
  }, [preview]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <GasFeeSelector options={options} nativePrice={getMockToken("ETH").price} live={preview === "live"} />
      <DemoStateSwitcher<Preview>
        states={["live", "paused", "congested"]}
        value={preview}
        onChange={(next) => {
          setPreview(next);
          setOptions(next === "congested" ? mockGasOptions.map((o) => ({ ...o, maxFeePerGas: o.maxFeePerGas * BigInt(6), seconds: o.seconds * 2 })) : mockGasOptions);
        }}
      />
    </div>
  );
}

export function NativeOnly() {
  return <GasFeeSelector className="max-w-md" options={mockGasOptions} live={false} label="Speed" />;
}
