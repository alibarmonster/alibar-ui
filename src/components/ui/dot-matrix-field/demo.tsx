"use client";

import { DotMatrixField } from "@/components/ui/dot-matrix-field/dot-matrix-field";

export function Default() {
  return (
    <DotMatrixField className="grid h-72 w-full max-w-xl place-items-center rounded-2xl border border-border">
      <p className="rounded-full bg-background px-3 py-1 text-sm font-medium text-foreground shadow-xs">Hover to swell the dots</p>
    </DotMatrixField>
  );
}

export function Primary() {
  return <DotMatrixField className="h-60 w-full max-w-md rounded-2xl" color="#2563EB" spacing={18} maxSize={0.42} />;
}
