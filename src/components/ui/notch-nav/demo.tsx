"use client";

import { Sprout } from "lucide-react";
import { NotchNav } from "@/components/ui/notch-nav/notch-nav";
import { NavbarStage } from "@/components/site/navbar-demo";

const left = [
  { label: "Gardens", href: "#" },
  { label: "Journal", href: "#" },
];
const right = [
  { label: "Saved", href: "#" },
  { label: "Settings", href: "#" },
];

export function Default() {
  return <NavbarStage height={500}>{() => <NotchNav logo={<Sprout />} left={left} right={right} defaultActive="Journal" actions={[{ label: "Sign in", href: "#" }]} />}</NavbarStage>;
}

export function Ink() {
  return <NavbarStage height={500}>{() => <NotchNav logo={<Sprout />} left={left} right={right} accent="#18181b" />}</NavbarStage>;
}
