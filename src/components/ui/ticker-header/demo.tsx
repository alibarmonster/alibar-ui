"use client";

import { TickerHeader } from "@/components/ui/ticker-header/ticker-header";
import { KiteBrand, NavbarStage, navActions, navItems } from "@/components/site/navbar-demo";

const announcements = ["Kite 4.0 is here: agent notebooks for everyone", "Live workshop on Thursday, save a seat", "We raised our Series B to build faster"];

export function Default() {
  return <NavbarStage>{(scroll) => <TickerHeader brand={<KiteBrand />} items={navItems} actions={navActions} announcements={announcements} scrollContainer={scroll} />}</NavbarStage>;
}
