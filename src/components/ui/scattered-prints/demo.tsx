"use client";

import { galleryItems } from "@/components/site/gallery-images";
import { ScatteredPrints } from "@/components/ui/scattered-prints/scattered-prints";

export function Table() {
  return (
    <div className="h-[30rem] w-full overflow-hidden rounded-xl border border-border bg-[#F3EEE6]">
      <ScatteredPrints items={galleryItems} count={10} ariaLabel="Prints on the table" />
    </div>
  );
}

export function Wooden() {
  return (
    <div className="h-[30rem] w-full overflow-hidden rounded-xl bg-[linear-gradient(135deg,#6B4A34,#8A6143_40%,#5E3F2C)]">
      <ScatteredPrints items={galleryItems.slice(8)} count={8} scatterTilt={22} size={0.24} seed={4} ariaLabel="Prints on a wooden table" />
    </div>
  );
}
