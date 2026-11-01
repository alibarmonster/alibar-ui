"use client";

import { GrainGradient } from "@/components/ui/grain-gradient/grain-gradient";

export function Default() {
  return (
    <GrainGradient className="flex h-72 w-full max-w-xl items-end rounded-2xl p-6">
      <p className="max-w-xs text-2xl font-semibold tracking-tight text-slate-900">A little texture goes a long way.</p>
    </GrainGradient>
  );
}

export function HeavyGrain() {
  return <GrainGradient className="h-60 w-full max-w-md rounded-2xl" colors={["#FDE68A", "#FBCFE8", "#C7D2FE"]} grain={0.45} speed={0.6} />;
}
