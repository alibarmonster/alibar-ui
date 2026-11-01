"use client";

import { LogoCloudCycle } from "@/components/ui/logo-cloud-cycle/logo-cloud-cycle";
import { placeholderLogos } from "@/components/site/placeholder-logos";

export function Default() {
  return <LogoCloudCycle eyebrow="Loved by teams at" items={placeholderLogos} />;
}

export function Wide() {
  return <LogoCloudCycle items={placeholderLogos} slots={4} columns={4} interval={1400} />;
}
