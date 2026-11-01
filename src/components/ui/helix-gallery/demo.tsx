"use client";

import { galleryItems } from "@/components/site/gallery-images";
import { HelixGallery } from "@/components/ui/helix-gallery/helix-gallery";

export function Helix() {
  return (
    <div className="h-[32rem] w-full">
      <HelixGallery items={galleryItems} startIndex={4} ariaLabel="Prints on a helix" />
    </div>
  );
}

export function TightNight() {
  return (
    <div className="h-[32rem] w-full overflow-hidden rounded-xl">
      <HelixGallery items={galleryItems} perTurn={6} rise={0.3} radius={0.26} backgroundColor="#0C0D12" autoplay interval={2800} ariaLabel="Prints on a tight helix" />
    </div>
  );
}
