"use client";

import { FloatBar } from "@/components/ui/float-bar/float-bar";
import { KiteBrand, NavbarStage, capabilityLinks, navActions, navItems } from "@/components/site/navbar-demo";

export function Default() {
  return <NavbarStage>{() => <FloatBar brand={<KiteBrand />} items={navItems} secondary={navActions[0]} cta={navActions[1]} />}</NavbarStage>;
}

export function Green() {
  return <NavbarStage>{() => <FloatBar brand={<KiteBrand />} items={[{ label: "Platform", items: capabilityLinks }, ...navItems.slice(1)]} cta={{ label: "Book a demo", href: "#" }} accent="#0f9f6e" />}</NavbarStage>;
}
