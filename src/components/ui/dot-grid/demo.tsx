"use client";

import { DotGrid } from "@/components/ui/dot-grid/dot-grid";

export function Default() {
  return (
    <DotGrid className="flex h-72 w-full max-w-2xl items-center justify-center rounded-2xl border border-border bg-background">
      <div className="pointer-events-none text-center">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Move your cursor</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Build on a quiet grid</p>
      </div>
    </DotGrid>
  );
}

export function Dense() {
  return (
    <DotGrid
      gap={12}
      dotSize={1}
      radius={90}
      maxScale={3}
      color="color-mix(in oklab, var(--foreground) 18%, transparent)"
      activeColor="var(--chart-2)"
      className="h-64 w-full max-w-md rounded-2xl border border-border bg-surface"
    />
  );
}
