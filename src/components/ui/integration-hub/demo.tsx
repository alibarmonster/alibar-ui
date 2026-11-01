"use client";

import { IntegrationHub } from "@/components/ui/integration-hub/integration-hub";
import { placeholderBrands } from "@/components/site/placeholder-logos";

const tools = (from: number, to: number) => placeholderBrands.slice(from, to).map((brand) => ({ name: brand.name, icon: <brand.Mark /> }));

const Logo = () => (
  <svg viewBox="0 0 24 24" className="size-9 text-foreground" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-label="Your product">
    <path d="M6.5 16.75c2.6 0 3.7-1.5 4.6-4.1l.5-1.4c.9-2.5 2-4 4.9-4" />
  </svg>
);

export function Default() {
  return <IntegrationHub center={<Logo />} items={tools(0, 6)} />;
}

export function Inbound() {
  return <IntegrationHub center={<Logo />} items={tools(6, 10)} inbound duration={2.4} showLabels={false} />;
}
