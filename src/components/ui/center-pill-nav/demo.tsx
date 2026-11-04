"use client";

import { CenterPillNav } from "@/components/ui/center-pill-nav/center-pill-nav";
import { KiteBrand, NavbarStage, navActions, navItems, productLinks, resourceLinks } from "@/components/site/navbar-demo";

export function Default() {
  return <NavbarStage height={500}>{() => <CenterPillNav brand={<KiteBrand />} items={[{ label: "Product", items: productLinks }, { label: "Resources", items: resourceLinks }, { label: "Enterprise", href: "#" }, { label: "Pricing", href: "#" }]} actions={[{ label: "Log in", href: "#" }, { label: "Contact sales", href: "#" }, { label: "Sign up free", href: "#" }]} />}</NavbarStage>;
}

export function Violet() {
  return <NavbarStage>{() => <CenterPillNav brand={<KiteBrand />} items={navItems} actions={navActions} accent="#6d28d9" />}</NavbarStage>;
}
