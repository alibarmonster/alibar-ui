"use client";

import { LightRays } from "@/components/ui/light-rays/light-rays";

export function Default() {
  return (
    <LightRays className="grid h-80 w-full max-w-xl place-items-center rounded-2xl border border-border bg-background">
      <div className="text-center">
        <p className="text-3xl font-semibold tracking-tight text-foreground">Good morning</p>
        <p className="mt-1 text-sm text-muted-foreground">Your daily brief is ready.</p>
      </div>
    </LightRays>
  );
}

export function Cool() {
  return <LightRays className="h-64 w-full max-w-md rounded-2xl bg-slate-50" color="#60A5FA" intensity={0.7} sway={1.6} />;
}
