"use client";

import { galleryImages } from "@/components/site/gallery-images";
import { ShelfGallery, type ShelfItem } from "@/components/ui/shelf-gallery/shelf-gallery";

const items: ShelfItem[] = galleryImages.slice(0, 5).map((g) => ({ id: g.src, image: g.src, alt: g.alt, title: g.title, subtitle: g.subtitle }));
const more: ShelfItem[] = galleryImages.slice(5, 13).map((g) => ({ id: g.src, image: g.src, alt: g.alt, title: g.title, subtitle: g.subtitle }));

export function Default() {
  return (
    <ShelfGallery
      items={items}
      emptyShelves={1}
      label="Editions"
      renderDetail={(item) => <p className="mt-2 text-[13px] text-muted-foreground">Edition {items.indexOf(item) + 1} of {items.length}. Every cover here is a generated placeholder.</p>}
    />
  );
}

export function TwoShelves() {
  return <ShelfGallery items={more} perShelf={4} label="Records" />;
}
