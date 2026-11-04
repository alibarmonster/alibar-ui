"use client";

import { GatherNav } from "@/components/ui/gather-nav/gather-nav";
import { NavbarStage } from "@/components/site/navbar-demo";

const items = [
  { label: "Tools", href: "#" },
  { label: "By role", href: "#" },
  { label: "Collections", href: "#" },
  { label: "News", href: "#" },
  { label: "About", href: "#" },
];

const wordmark = (
  <a href="#" className="rounded-md text-[16px] font-semibold tracking-tight text-[#141414] outline-none focus-visible:ring-2 focus-visible:ring-ring">
    kite.tools
  </a>
);

export function Default() {
  return <NavbarStage texture>{(scroll) => <GatherNav brand={wordmark} items={items} cta={{ label: "Submit a tool", href: "#" }} onSearch={() => {}} scrollContainer={scroll} />}</NavbarStage>;
}

export function OverPhoto() {
  return <NavbarStage image="/gallery/08-blue-hour.webp">{(scroll) => <GatherNav brand={wordmark} items={items} cta={{ label: "Submit a tool", href: "#" }} onSearch={() => {}} scrollContainer={scroll} gatherAfter={0} />}</NavbarStage>;
}
