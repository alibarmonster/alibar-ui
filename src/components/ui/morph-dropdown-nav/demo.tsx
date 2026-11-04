"use client";

import { MorphDropdownNav } from "@/components/ui/morph-dropdown-nav/morph-dropdown-nav";
import { KiteBrand, NavbarStage, capabilityLinks, navActions, productLinks, resourceLinks } from "@/components/site/navbar-demo";

const items = [
  { label: "Product", items: productLinks },
  { label: "Platform", items: capabilityLinks },
  { label: "Resources", items: resourceLinks },
  { label: "Pricing", href: "#" },
];

export function Default() {
  return <NavbarStage dark height={500}>{() => <MorphDropdownNav brand={<KiteBrand dark />} items={items} actions={navActions} />}</NavbarStage>;
}
