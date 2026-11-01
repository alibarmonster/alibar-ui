"use client";

import { galleryItems } from "@/components/site/gallery-images";
import { PageFlipBook } from "@/components/ui/page-flip-book/page-flip-book";

export function Book() {
  return <PageFlipBook items={galleryItems.slice(0, 13)} ariaLabel="Print catalogue" />;
}

export function SquarePages() {
  return <PageFlipBook items={galleryItems.slice(10, 21)} aspect={1} curl={0.9} startSpread={2} ariaLabel="Square sketchbook" />;
}
