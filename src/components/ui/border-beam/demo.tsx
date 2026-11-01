"use client";

import { BorderBeam } from "@/components/ui/border-beam/border-beam";

export function Default() {
  return (
    <BorderBeam className="w-full max-w-sm p-6">
      <p className="text-sm font-medium text-primary">Pro plan</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">$24 / month</p>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">Unlimited projects, priority support and early access to new components.</p>
      <button type="button" className="mt-5 h-10 w-full cursor-pointer rounded-xl bg-foreground text-sm font-semibold text-background">
        Upgrade
      </button>
    </BorderBeam>
  );
}

export function TwoBeams() {
  return (
    <div className="relative w-full max-w-sm">
      <BorderBeam className="p-6" radius={20} colorFrom="#16A34A" colorTo="#14B8A6" duration={8} size={0.25}>
        <BorderBeam className="pointer-events-none absolute inset-0 border-transparent bg-transparent" radius={20} colorFrom="#F59E0B" colorTo="#EF4444" duration={8} size={0.25} delay={4}>
          <span />
        </BorderBeam>
        <p className="text-sm font-semibold text-foreground">Deploying to production</p>
        <p className="mt-1 text-[13px] text-muted-foreground">Two beams, half a lap apart.</p>
      </BorderBeam>
    </div>
  );
}
