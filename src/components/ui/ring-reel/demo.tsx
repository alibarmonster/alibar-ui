"use client";

import { galleryItems } from "@/components/site/gallery-images";
import { RingReel } from "@/components/ui/ring-reel/ring-reel";

export function Collection() {
  return (
    <div className="h-[32rem] w-full">
      <RingReel items={galleryItems} ariaLabel="Spring prints">
        <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Spring collection</p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">Sixteen prints on one turning wheel</p>
        <p className="mt-2 text-[13px] text-muted-foreground">Click a card to zoom in.</p>
      </RingReel>
    </div>
  );
}

export function ArcView() {
  return (
    <div className="h-[30rem] w-full">
      <RingReel items={galleryItems} defaultView="arc" startIndex={4} interval={3000} ariaLabel="Featured prints" />
    </div>
  );
}

export function FerrisWheel() {
  return (
    <div className="h-[32rem] w-full overflow-hidden rounded-xl">
      <RingReel items={galleryItems.slice(8, 20)} lean={false} spin={10} backgroundColor="#0E1116" accentColor="#F59E0B" aspect={0.8} ariaLabel="Night rides">
        <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Night rides</p>
        <p className="mt-1.5 text-[13px] text-white/70">Twelve cabins, always upright.</p>
      </RingReel>
    </div>
  );
}
