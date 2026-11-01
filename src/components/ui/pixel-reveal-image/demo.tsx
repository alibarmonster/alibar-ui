"use client";

import { PixelRevealImage } from "@/components/ui/pixel-reveal-image/pixel-reveal-image";

// An original illustration as a data URI, so the demo ships no external image.
const LANDSCAPE = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93c5fd"/><stop offset="0.55" stop-color="#fde68a"/><stop offset="1" stop-color="#fdba74"/></linearGradient></defs>
<rect width="1200" height="900" fill="url(#s)"/><circle cx="830" cy="420" r="110" fill="#fff7ed"/>
<path d="M0 620 L180 430 L330 560 L520 340 L760 600 L930 450 L1200 640 L1200 900 L0 900Z" fill="#6366f1" opacity="0.55"/>
<path d="M0 720 L220 560 L420 690 L640 520 L880 700 L1060 590 L1200 680 L1200 900 L0 900Z" fill="#4338ca" opacity="0.8"/>
<path d="M0 800 Q300 720 600 790 T1200 780 L1200 900 L0 900Z" fill="#1e1b4b"/></svg>`)}`;

export function Default() {
  return <PixelRevealImage className="w-full max-w-lg" src={LANDSCAPE} alt="Mountains at sunset under a warm sky" />;
}

export function OnHover() {
  return (
    <figure className="w-full max-w-sm">
      <PixelRevealImage trigger="hover" cellSize={28} src={LANDSCAPE} alt="Mountains at sunset under a warm sky" />
      <figcaption className="mt-2 text-center text-[13px] text-muted-foreground">Hover to sharpen</figcaption>
    </figure>
  );
}
