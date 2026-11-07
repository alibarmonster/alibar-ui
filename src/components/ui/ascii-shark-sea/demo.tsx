"use client";

import { AsciiSharkSea } from "@/components/ui/ascii-shark-sea/ascii-shark-sea";

export function Hero() {
  return (
    <AsciiSharkSea className="h-[560px] w-full rounded-2xl border border-border">
      <div className="pointer-events-none flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="font-mono text-[11px] tracking-[0.14em] text-[#55636f] uppercase">Open water / survey 07</p>
        <h3 className="mt-3 max-w-lg text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.08] font-semibold tracking-tight text-[#10202c]">Something big is passing below.</h3>
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#3d4f5c]">Move the cursor to scatter the fish, or click the water to drop bait.</p>
      </div>
    </AsciiSharkSea>
  );
}

export function Night() {
  return (
    <AsciiSharkSea
      palette="dark"
      sharks={[{ kind: "great-white" }, { kind: "hammerhead", size: 0.86 }, { kind: "reef", size: 0.7 }, { kind: "reef", size: 0.62 }]}
      schools={9}
      className="h-[520px] w-full rounded-2xl"
    />
  );
}

export function Species() {
  return (
    <AsciiSharkSea
      palette="dark"
      sharks={[{ kind: "thresher" }, { kind: "tiger", size: 0.9 }, { kind: "hammerhead", size: 0.8 }]}
      schools={6}
      cell={10}
      className="h-[520px] w-full rounded-2xl"
    />
  );
}

export function Default() {
  return <AsciiSharkSea className="w-full rounded-2xl" />;
}
