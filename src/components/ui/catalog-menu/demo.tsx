"use client";

import { CatalogMenu } from "@/components/ui/catalog-menu/catalog-menu";
import { KiteBrand, NavbarStage, capabilityLinks, navActions, productLinks, resourceLinks } from "@/components/site/navbar-demo";

const items = [
  {
    label: "Platform",
    groups: [
      { title: "Build", links: productLinks.slice(0, 2) },
      { title: "Automate", links: productLinks.slice(2) },
      { title: "Scale", links: capabilityLinks },
    ],
    spotlight: { label: "New: agent notebooks", href: "#", description: "Ask questions in plain language and get charts back." },
  },
  { label: "Resources", items: resourceLinks },
  { label: "Customers", href: "#" },
  { label: "Pricing", href: "#" },
];

export function Default() {
  return <NavbarStage height={560}>{() => <CatalogMenu brand={<KiteBrand />} items={items} actions={[navActions[0], { label: "Request a demo", href: "#" }, { label: "Try free", href: "#" }]} />}</NavbarStage>;
}
