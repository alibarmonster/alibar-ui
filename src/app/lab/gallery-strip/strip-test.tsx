"use client";

import { galleryItems } from "@/components/site/gallery-images";
import { GalleryA11y } from "@/lib/gallery/gallery-a11y";
import { GalleryFallback } from "@/lib/gallery/gallery-fallback";
import { clamp } from "@/lib/gallery/math";
import type { GalleryCard } from "@/lib/gallery/renderer";
import { useGallery } from "@/lib/gallery/use-gallery";

const items = galleryItems.slice(0, 10);
const images = items.map((item) => item.src);

const cardWidth = (width: number) => clamp(width * 0.36, 150, 240);

/** Phase A check: 10 textured cards on a flat strip with drag, throw, snap, wheel and keys. */
export function StripTest() {
  const { hostRef, bind, status, input } = useGallery({
    images,
    count: items.length,
    dragDistance: (width) => cardWidth(width) * 1.14,
    frame: ({ dt, width }, gallery) => {
      const moving = gallery.update(dt);
      const position = gallery.position();
      const w = cardWidth(width);
      const h = w * 1.25;
      const step = w * 1.14;
      const cards: GalleryCard[] = items.map((_, i) => {
        const offset = i - position;
        return {
          image: i,
          x: offset * step,
          y: 18,
          z: 0,
          width: w,
          height: h,
          radius: 16,
          shadow: 1,
          reflection: 0.3,
          dim: clamp(Math.abs(offset) * 0.16, 0, 0.4),
        };
      });
      return { cards, animating: moving, scene: { floorY: 18 - h / 2 - 12, edgeFade: [0.12, 0] } };
    },
  });
  const active = items[input.index];

  return (
    <main className="min-h-svh bg-white px-4 py-12 text-zinc-950 [color-scheme:light] sm:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Gallery engine: flat strip</h1>
      <p className="mt-1 max-w-xl text-sm text-zinc-500">
        Ten textured cards from the shared renderer. Drag or throw (snaps to a card), use the wheel, or Tab in and use ← →, Home and End.
      </p>
      <div
        ref={bind}
        data-testid="strip"
        data-index={input.index}
        data-status={status}
        className="relative mt-8 h-[440px] touch-pan-y rounded-2xl select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-600"
      >
        <div ref={hostRef} className="absolute inset-0" />
        {status === "fallback" ? (
          <GalleryFallback items={items} label="Test strip" className="absolute inset-0" />
        ) : (
          <GalleryA11y items={items} index={input.index} label="Test strip" onFocusItem={(i) => input.goTo(i)} onActivate={(i) => input.goTo(i)} />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-4">
        <p data-testid="caption" className="text-sm">
          <span className="font-medium">{active.title}</span> <span className="text-zinc-500">· {active.subtitle}</span>
        </p>
        <div className="flex items-center gap-2 text-sm tabular-nums">
          <button type="button" data-gallery-control onClick={input.previous} className="h-9 rounded-full border border-zinc-200 px-3">
            Previous
          </button>
          <span>
            {input.index + 1} / {items.length}
          </span>
          <button type="button" data-gallery-control onClick={input.next} className="h-9 rounded-full border border-zinc-200 px-3">
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
