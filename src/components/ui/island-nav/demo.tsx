"use client";

import { IslandNav } from "@/components/ui/island-nav/island-nav";
import { KiteBrand, NavbarStage, navItems } from "@/components/site/navbar-demo";

export function Default() {
  return <NavbarStage>{(scroll) => <IslandNav brand={<KiteBrand dark />} items={navItems} cta={{ label: "Get started", href: "#" }} scrollContainer={scroll} />}</NavbarStage>;
}

export function OnDark() {
  return (
    <NavbarStage dark>
      {(scroll) => <IslandNav brand={<KiteBrand dark />} items={[{ label: "Features", href: "#" }, { label: "Changelog", href: "#" }, { label: "Docs", href: "#" }]} cta={{ label: "Download", href: "#" }} scrollContainer={scroll} />}
    </NavbarStage>
  );
}
