"use client";

import { SpotlightLogoGrid } from "@/components/ui/spotlight-logo-grid/spotlight-logo-grid";
import { placeholderLogos } from "@/components/site/placeholder-logos";

export function Default() {
  return <SpotlightLogoGrid eyebrow="Move your cursor across the grid" items={placeholderLogos.slice(0, 8).map((l) => ({ ...l, href: `#${l.name.toLowerCase()}` }))} />;
}

export function Neutral() {
  return <SpotlightLogoGrid items={placeholderLogos.slice(4, 10)} columns={3} color="var(--foreground)" radius={160} />;
}
