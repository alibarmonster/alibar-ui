"use client";

import { PixelMosaic } from "@/components/ui/pixel-mosaic/pixel-mosaic";

export function Default() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-background">
      <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <h3 className="text-3xl leading-none font-medium tracking-tight text-foreground uppercase sm:text-4xl">
          Craft,
          <br />
          engineered.
        </h3>
        <p className="max-w-[16rem] text-[12px] leading-5 text-muted-foreground uppercase">A design and technology partner for modern brands</p>
      </div>
      <PixelMosaic className="h-72 w-full" />
      <p className="p-6 text-lg text-foreground">A short point of view on what changed in how we work, and what didn&apos;t.</p>
    </div>
  );
}

export function Sunset() {
  return (
    <PixelMosaic edge="both" fill={0.35} cell={10} colors={["#3b0764", "#be185d", "#f97316", "#fde047"]} className="h-64 w-full rounded-2xl">
      <div className="pointer-events-none grid h-full place-items-center">
        <p className="rounded-full bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm">Move your cursor over the pixels</p>
      </div>
    </PixelMosaic>
  );
}
