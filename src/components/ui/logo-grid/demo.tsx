"use client";

import { LogoGrid } from "@/components/ui/logo-grid/logo-grid";
import { placeholderLogos } from "@/components/site/placeholder-logos";

const ITEMS = placeholderLogos.slice(0, 8).map((logo) => ({ ...logo, href: `#${logo.name.toLowerCase()}` }));

export function Default() {
  return <LogoGrid eyebrow="Trusted by fast-growing startups" items={ITEMS} />;
}

export function Fill() {
  return <LogoGrid variant="fill" eyebrow="Teams shipping with us" items={ITEMS} />;
}

export function Plain() {
  return <LogoGrid variant="plain" columns={3} linkLabel="Case study" items={placeholderLogos.slice(6, 12).map((l) => ({ ...l, href: `#${l.name.toLowerCase()}` }))} />;
}
