"use client";

import { Compass, House, MessageCircle, Sparkles, UserRound } from "lucide-react";
import { LiquidTabNav } from "@/components/ui/liquid-tab-nav/liquid-tab-nav";
import { KiteBrand, NavbarStage } from "@/components/site/navbar-demo";

const tabs = [
  { label: "Home", href: "#", icon: <House /> },
  { label: "Explore", href: "#", icon: <Compass /> },
  { label: "Imagine", href: "#", icon: <Sparkles /> },
  { label: "Messages", href: "#", icon: <MessageCircle /> },
  { label: "Profile", href: "#", icon: <UserRound /> },
];

export function Default() {
  return <NavbarStage>{() => <LiquidTabNav brand={<KiteBrand />} tabs={tabs} defaultActive="Imagine" cta={{ label: "Start free", href: "#" }} />}</NavbarStage>;
}

export function Dark() {
  return <NavbarStage dark>{() => <LiquidTabNav brand={<KiteBrand dark />} tabs={tabs} tone="dark" cta={{ label: "Start free", href: "#" }} />}</NavbarStage>;
}
