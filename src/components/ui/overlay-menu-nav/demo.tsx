"use client";

import { OverlayMenuNav } from "@/components/ui/overlay-menu-nav/overlay-menu-nav";
import { KiteBrand, NavbarStage } from "@/components/site/navbar-demo";

const groups = [
  { title: "Platform", links: [{ label: "Kite home", href: "#" }, { label: "Company", href: "#" }, { label: "Pricing", href: "#" }, { label: "Contact", href: "#" }] },
  { title: "Resources", links: [{ label: "Blog", href: "#" }, { label: "Careers", href: "#", badge: "We're hiring" }, { label: "Customer stories", href: "#" }] },
  { title: "Legal", links: [{ label: "Cookies", href: "#" }, { label: "Terms", href: "#" }, { label: "Privacy", href: "#" }] },
];

const features = [
  { title: "Charts people actually read", href: "#", image: "/gallery/02-paper-sun.webp", tag: "Product" },
  { title: "Fewer meetings, faster answers", href: "#", image: "/gallery/14-harbor-lights.webp", tag: "Operations" },
];

export function Default() {
  return <NavbarStage height={560}>{() => <OverlayMenuNav brand={<KiteBrand inherit />} groups={groups} features={features} overlayClassName="h-[560px]" />}</NavbarStage>;
}

export function OnDark() {
  return <NavbarStage dark height={560}>{() => <OverlayMenuNav brand={<KiteBrand inherit />} groups={groups} tone="dark" overlayClassName="h-[560px]" />}</NavbarStage>;
}
