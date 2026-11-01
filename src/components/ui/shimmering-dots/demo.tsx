"use client";

import { ShimmeringDots } from "@/components/ui/shimmering-dots/shimmering-dots";

export function Default() {
  return (
    <ShimmeringDots className="flex h-72 w-full max-w-2xl items-center justify-center rounded-2xl border border-border bg-background">
      <div className="text-center">
        <p className="text-3xl font-semibold tracking-tight text-foreground">Quietly alive</p>
        <p className="mt-2 text-sm text-muted-foreground">A few dots catch the light at a time.</p>
      </div>
    </ShimmeringDots>
  );
}

export function Muted() {
  return (
    <ShimmeringDots
      gap={10}
      size={1.5}
      color="var(--foreground)"
      baseOpacity={0.06}
      peakOpacity={0.5}
      density={0.3}
      speed={0.7}
      fade={false}
      className="h-56 w-full max-w-md rounded-2xl border border-border bg-surface"
    />
  );
}
