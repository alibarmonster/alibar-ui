"use client";

import { ParticleField } from "@/components/ui/particle-field/particle-field";

export function Default() {
  return (
    <ParticleField className="flex h-72 w-full max-w-2xl items-center justify-center rounded-2xl border border-border bg-background">
      <div className="pointer-events-none text-center">
        <p className="text-3xl font-semibold tracking-tight text-foreground">Everything is connected</p>
        <p className="mt-2 text-sm text-muted-foreground">Move your cursor through the field.</p>
      </div>
    </ParticleField>
  );
}

export function Accent() {
  return (
    <ParticleField
      links={false}
      density={3}
      color="var(--primary)"
      repelRadius={90}
      repelStrength={1.6}
      speed={0.15}
      className="h-56 w-full max-w-md rounded-2xl border border-border bg-surface"
    />
  );
}
