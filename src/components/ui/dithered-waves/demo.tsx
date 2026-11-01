"use client";

import { DitheredWaves } from "@/components/ui/dithered-waves/dithered-waves";

export function Default() {
  return (
    <DitheredWaves className="h-72 w-full max-w-xl rounded-2xl border border-border">
      <p className="m-5 inline-block rounded-md bg-background px-2 py-1 font-mono text-sm font-medium tracking-wider text-foreground uppercase">Signal / Noise</p>
    </DitheredWaves>
  );
}

export function BlueInk() {
  return <DitheredWaves className="h-60 w-full max-w-md rounded-2xl" pixelSize={4} color="#1D4ED8" backgroundColor="#EFF6FF" intensity={1.2} />;
}
