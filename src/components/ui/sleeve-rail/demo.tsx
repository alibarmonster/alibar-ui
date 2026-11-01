"use client";

import { galleryItems } from "@/components/site/gallery-images";
import { SleeveRail } from "@/components/ui/sleeve-rail/sleeve-rail";

export function RecordShelf() {
  return (
    <div className="h-[34rem] w-full">
      <SleeveRail items={galleryItems} startIndex={3} />
    </div>
  );
}

export function NightListening() {
  return (
    <div className="h-[34rem] w-full overflow-hidden rounded-xl">
      <SleeveRail items={galleryItems} startIndex={8} backgroundColor="#111014" rpm={45} visibleSide={4} dim={0.45} ariaLabel="Late night albums" />
    </div>
  );
}

export function ColoredVinyl() {
  return (
    <div className="h-[30rem] w-full">
      <SleeveRail
        items={galleryItems.slice(0, 12)}
        startIndex={5}
        controls={false}
        recordColor="#9F1239"
        fanAngle={9}
        turnAngle={52}
        packing={0.75}
        autoplay
        interval={3500}
        ariaLabel="Featured albums"
      />
    </div>
  );
}
