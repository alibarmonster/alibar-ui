"use client";

import { ImageLightbox, type LightboxImage } from "@/components/ui/image-lightbox/image-lightbox";

/** Seeded mountain ridge as an SVG path across width w. */
function ridge(seed: number, w: number, h: number, base: number, amp: number) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const points: string[] = [];
  for (let x = 0; x <= w; x += w / 12) points.push(`${x.toFixed(0)},${(base - rand() * amp).toFixed(0)}`);
  return `M0,${h} L${points.join(" L")} L${w},${h} Z`;
}

/** An original landscape illustration, as a data URI, so the demo needs no external images. */
function scene(w: number, h: number, sky: [string, string], hills: string[], sun: string, seed: number) {
  const layers = hills
    .map((fill, i) => `<path d="${ridge(seed + i * 7, w, h, h * (0.55 + i * 0.13), h * (0.22 - i * 0.04))}" fill="${fill}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#s)"/><circle cx="${w * 0.7}" cy="${h * 0.32}" r="${Math.min(w, h) * 0.09}" fill="${sun}"/>${layers}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const IMAGES: LightboxImage[] = [
  { src: scene(1200, 800, ["#fde4cf", "#fbc4ab"], ["#e8a598", "#c97b7b", "#8f5a6b"], "#fff3e0", 3), width: 1200, height: 800, alt: "Peach dusk over layered hills", caption: "Dusk, Serra da Estrela" },
  { src: scene(800, 1000, ["#cfe8ff", "#e9f5ff"], ["#a3c4f3", "#6c8ebf", "#3e5c8a"], "#ffffff", 11), width: 800, height: 1000, alt: "Pale blue morning over tall ridges", caption: "Morning, Dolomites" },
  { src: scene(1000, 1000, ["#e0f2e9", "#f4fbf7"], ["#9ad1b8", "#5fae8f", "#2f7a63"], "#fffde8", 19), width: 1000, height: 1000, alt: "Green valley under a soft sun", caption: "Valley, Azores" },
  { src: scene(1200, 700, ["#2e1f4d", "#6b4c9a"], ["#4b3a73", "#33275a", "#1d1538"], "#ffd6a5", 27), width: 1200, height: 700, alt: "Violet night with a low moon over dark hills", caption: "Night, Atacama" },
  { src: scene(900, 1200, ["#fff1c1", "#ffe08a"], ["#f4b860", "#d98b3a", "#a35d23"], "#fffbe6", 35), width: 900, height: 1200, alt: "Golden afternoon over warm desert ridges", caption: "Afternoon, Wadi Rum" },
  { src: scene(1000, 750, ["#dfe7ec", "#f5f7f8"], ["#b8c4cc", "#8a9aa5", "#5d6d78"], "#ffffff", 43), width: 1000, height: 750, alt: "Grey misty mountains", caption: "Mist, Faroe Islands" },
];

export function Default() {
  return (
    <div className="w-full max-w-2xl">
      <ImageLightbox images={IMAGES} />
      <p className="mt-1 text-xs text-muted-foreground">Click an image; swipe, use the arrows or ← → to move between them.</p>
    </div>
  );
}
