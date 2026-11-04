"use client";

import { TakeoverNav } from "@/components/ui/takeover-nav/takeover-nav";
import { NavbarStage } from "@/components/site/navbar-demo";

const items = [
  { label: "Work", href: "#" },
  { label: "Studio", href: "#" },
  { label: "Team", href: "#" },
  { label: "Contact", href: "#" },
];

const corners = {
  topLeft: (
    <>
      12 Harbor Street
      <br />
      Lisbon, Portugal
    </>
  ),
  topRight: (
    <>
      48 Mill Road
      <br />
      Leeds, United Kingdom
    </>
  ),
  bottomLeft: "A studio of curious makers",
  bottomRight: "EN / PT",
};

const photo = "/gallery/19-velvet-rooms.webp";

export function Default() {
  return <NavbarStage image={photo} height={560}>{() => <TakeoverNav name="Kite Studio" items={items} corners={corners} menuClassName="h-[560px]" />}</NavbarStage>;
}

export function Tangerine() {
  return <NavbarStage image="/gallery/04-night-ferry.webp" height={560}>{() => <TakeoverNav name="Kite Studio" items={items} corners={corners} accent="#ff6a2b" ink="#1a0c05" menuClassName="h-[560px]" />}</NavbarStage>;
}

export function Lilac() {
  return <NavbarStage image="/gallery/11-quiet-engines.webp" height={560}>{() => <TakeoverNav name="Kite Studio" items={items} corners={corners} accent="#cdbbff" ink="#1d1233" menuClassName="h-[560px]" />}</NavbarStage>;
}
