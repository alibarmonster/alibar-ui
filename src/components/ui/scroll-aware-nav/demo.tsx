"use client";

import { ScrollAwareNav } from "@/components/ui/scroll-aware-nav/scroll-aware-nav";
import { KiteBrand, NavbarStage, navActions, navItems } from "@/components/site/navbar-demo";

export function Default() {
  return <NavbarStage>{(scroll) => <ScrollAwareNav brand={<KiteBrand />} items={navItems} actions={navActions} scrollContainer={scroll} />}</NavbarStage>;
}

export function AlwaysShown() {
  return <NavbarStage>{(scroll) => <ScrollAwareNav brand={<KiteBrand />} items={navItems} actions={navActions} scrollContainer={scroll} hideOnScroll={false} accent="#f97316" />}</NavbarStage>;
}
