"use client";

import { GooeyNav } from "@/components/ui/gooey-nav/gooey-nav";
import { NavbarStage } from "@/components/site/navbar-demo";

const items = [
  { label: "Features", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Daily prompts", href: "#" },
];

export function Default() {
  return <NavbarStage>{() => <GooeyNav brand="K." items={items} cta={{ label: "Get the app", href: "#" }} />}</NavbarStage>;
}

export function Light() {
  return <NavbarStage dark>{() => <GooeyNav brand="K." items={items} cta={{ label: "Get the app", href: "#" }} tone="light" />}</NavbarStage>;
}
