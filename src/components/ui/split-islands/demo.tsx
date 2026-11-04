"use client";

import { SplitIslands } from "@/components/ui/split-islands/split-islands";
import { KiteMark, NavbarStage, capabilityLinks, navActions, productLinks, resourceLinks } from "@/components/site/navbar-demo";

const mark = (
  <a href="#" aria-label="Kite home" className="grid size-9 place-items-center rounded-xl bg-[#0b0b0c] text-white outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <KiteMark className="size-5" />
  </a>
);

export function Default() {
  return (
    <NavbarStage>
      {() => <SplitIslands brand={mark} items={[{ label: "Product", items: productLinks }, { label: "Solutions", items: capabilityLinks }, { label: "Resources", items: resourceLinks }]} links={[{ label: "Pricing", href: "#" }]} secondary={navActions[0]} cta={{ label: "Start free", href: "#" }} />}
    </NavbarStage>
  );
}
