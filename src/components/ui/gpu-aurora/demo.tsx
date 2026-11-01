"use client";

import { GpuAurora } from "@/components/ui/gpu-aurora/gpu-aurora";

export function Default() {
  return (
    <GpuAurora className="grid h-80 w-full max-w-xl place-items-center rounded-2xl border border-border bg-background">
      <p className="text-3xl font-semibold tracking-tight text-foreground">Northern lights</p>
    </GpuAurora>
  );
}

export function Sunrise() {
  return <GpuAurora className="h-64 w-full max-w-md rounded-2xl" colors={["#FDE68A", "#FDBA74", "#F9A8D4"]} intensity={1.1} />;
}
