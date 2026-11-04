"use client";

import { SheetNav } from "@/components/ui/sheet-nav/sheet-nav";
import { KiteBrand, NavbarStage, navActions, navItems, productLinks, resourceLinks } from "@/components/site/navbar-demo";

const aside = [
  { label: "hello@kite.dev", href: "#" },
  { label: "X / Twitter", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "GitHub", href: "#" },
];

export function Default() {
  return (
    <NavbarStage height={520}>
      {() => <SheetNav brand={<KiteBrand />} items={[{ label: "Product", items: productLinks }, { label: "Resources", items: resourceLinks }, { label: "Customers", href: "#" }, { label: "Pricing", href: "#" }, { label: "Company", href: "#" }]} aside={aside} actions={navActions} cta={{ label: "Book a demo", href: "#" }} sheetClassName="h-[520px]" />}
    </NavbarStage>
  );
}

export function Periwinkle() {
  return (
    <NavbarStage height={520}>
      {() => <SheetNav brand={<KiteBrand />} items={navItems} aside={aside} actions={navActions} background="#dfe8ff" sheetClassName="h-[520px]" />}
    </NavbarStage>
  );
}
