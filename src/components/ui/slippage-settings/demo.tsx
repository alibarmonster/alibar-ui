"use client";

import { useState } from "react";
import { SlippageSettings } from "@/components/ui/slippage-settings/slippage-settings";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";

type Preview = "default" | "custom" | "too low" | "too high";
const PRESET: Record<Preview, number> = { default: 50, custom: 75, "too low": 2, "too high": 1200 };

export function Default() {
  const [bps, setBps] = useState(50);
  const [preview, setPreview] = useState<Preview>("default");
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full max-w-sm items-center justify-between rounded-2xl border border-border bg-background py-2 pr-2 pl-4 shadow-sm">
        <span className="text-sm font-semibold text-foreground">Swap</span>
        <SlippageSettings value={bps} onValueChange={setBps} />
      </div>
      <DemoStateSwitcher<Preview>
        states={["default", "custom", "too low", "too high"]}
        value={preview}
        onChange={(next) => {
          setPreview(next);
          setBps(PRESET[next]);
        }}
      />
      <p className="text-[13px] text-muted-foreground">Open the settings to see each state&apos;s chips and warnings.</p>
    </div>
  );
}
