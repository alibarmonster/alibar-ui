"use client";

import { DuoPanelMenu } from "@/components/ui/duo-panel-menu/duo-panel-menu";
import { KiteBrand, NavbarStage, capabilityLinks, navActions, productLinks, resourceLinks } from "@/components/site/navbar-demo";

const items = [
  { label: "Product", items: productLinks, featured: capabilityLinks, featuredLabel: "Capabilities" },
  { label: "Resources", items: resourceLinks, featured: [{ label: "State of data 2026", href: "#", description: "Our yearly report, out now." }, { label: "Kite Live", href: "#", description: "Talks from our user conference." }], featuredLabel: "Spotlight" },
  { label: "Customers", href: "#" },
  { label: "Pricing", href: "#" },
];

export function Default() {
  return <NavbarStage height={520}>{() => <DuoPanelMenu brand={<KiteBrand />} items={items} actions={navActions} />}</NavbarStage>;
}
