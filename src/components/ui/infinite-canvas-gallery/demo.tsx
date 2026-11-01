"use client";

import { galleryItems } from "@/components/site/gallery-images";
import { InfiniteCanvasGallery } from "@/components/ui/infinite-canvas-gallery/infinite-canvas-gallery";

export function Canvas() {
  return (
    <div className="h-[32rem] w-full overflow-hidden rounded-xl border border-border">
      <InfiniteCanvasGallery items={galleryItems} ariaLabel="Endless prints" />
    </div>
  );
}

export function DriftingDark() {
  return (
    <div className="h-[32rem] w-full overflow-hidden rounded-xl">
      <InfiniteCanvasGallery items={galleryItems} autoplay backgroundColor="#0B0B0F" depth={0.3} cellSize={170} seed={8} ariaLabel="Drifting prints" />
    </div>
  );
}
