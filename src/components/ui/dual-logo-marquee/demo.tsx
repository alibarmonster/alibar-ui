"use client";

import { DualLogoMarquee } from "@/components/ui/dual-logo-marquee/dual-logo-marquee";
import { placeholderLogos } from "@/components/site/placeholder-logos";

export function Default() {
  return <DualLogoMarquee eyebrow="Powering product teams everywhere" items={placeholderLogos.slice(0, 6)} secondRow={placeholderLogos.slice(6, 12)} />;
}

export function Linked() {
  return <DualLogoMarquee speed={22} items={placeholderLogos.map((l) => ({ ...l, href: `#${l.name.toLowerCase()}` }))} />;
}
