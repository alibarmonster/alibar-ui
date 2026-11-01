"use client";

import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern/animated-grid-pattern";

export function Default() {
  return (
    <AnimatedGridPattern className="grid h-80 w-full max-w-2xl place-items-center rounded-2xl border border-border bg-background">
      <div className="text-center">
        <p className="text-3xl font-semibold tracking-tight text-foreground">Built on a grid</p>
        <p className="mt-1 text-sm text-muted-foreground">Squares light up one by one, then move on.</p>
      </div>
    </AnimatedGridPattern>
  );
}

export function Dense() {
  return <AnimatedGridPattern className="h-64 w-full max-w-md rounded-2xl" cellSize={24} count={30} maxOpacity={0.5} duration={3} color="#09090B" fade={false} />;
}
