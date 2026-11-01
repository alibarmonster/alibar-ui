"use client";

import { AuroraBackground } from "@/components/ui/aurora-background/aurora-background";

export function Default() {
  return (
    <AuroraBackground className="flex h-80 w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-border px-6 text-center">
      <p className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">New in 1.0</p>
      <p className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">Interfaces with a little weather in them</p>
      <button type="button" className="mt-6 h-10 cursor-pointer rounded-full bg-foreground px-5 text-sm font-medium text-background shadow-sm">
        Get started
      </button>
    </AuroraBackground>
  );
}

export function Mint() {
  return (
    <AuroraBackground
      colors={["#a7f3d0", "#bfdbfe", "#d9f99d"]}
      speed={1.6}
      fadeBottom={false}
      className="flex h-56 w-full max-w-md items-end rounded-2xl border border-border p-6"
    >
      <div>
        <p className="text-sm text-muted-foreground">Faster drift, custom colors</p>
        <p className="text-xl font-semibold tracking-tight text-foreground">Fresh start</p>
      </div>
    </AuroraBackground>
  );
}
