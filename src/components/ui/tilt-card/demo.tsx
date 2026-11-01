"use client";

import { TiltCard } from "@/components/ui/tilt-card/tilt-card";

export function Default() {
  return (
    <TiltCard className="aspect-[1.586] w-full max-w-80 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 p-6 text-white shadow-xl">
      {/* Children can sit at different depths with translateZ. */}
      <div className="flex h-full flex-col justify-between [transform:translateZ(36px)]">
        <div className="flex items-start justify-between">
          <span className="h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 shadow-inner" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-wide">alibar</span>
        </div>
        <div>
          <p className="font-mono text-lg tracking-[0.18em] tabular-nums">4021 •••• •••• 7718</p>
          <div className="mt-2 flex justify-between text-[11px] tracking-wider text-white/60 uppercase">
            <span>Ada Laurent</span>
            <span>09 / 29</span>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

export function Product() {
  return (
    <TiltCard maxTilt={7} glareOpacity={0.45} className="w-full max-w-64 rounded-2xl border border-border bg-card p-3 shadow-md">
      <div className="aspect-square rounded-xl bg-gradient-to-br from-sky-300 via-indigo-400 to-fuchsia-400 [transform:translateZ(24px)]" />
      <div className="px-1 pt-3 pb-1 [transform:translateZ(16px)]">
        <p className="text-sm font-semibold text-foreground">Aurora Lamp</p>
        <p className="text-xs text-muted-foreground">Hand-blown glass · $189</p>
      </div>
    </TiltCard>
  );
}

export function Subtle() {
  return (
    <TiltCard maxTilt={4} hoverScale={1.01} glare={false} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">Pro plan</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
        $24<span className="text-base font-normal text-muted-foreground"> / month</span>
      </p>
      <p className="mt-3 text-sm text-muted-foreground">A gentle 4° tilt without glare suits pricing and settings cards.</p>
    </TiltCard>
  );
}
