"use client";

import { Circle, Diamond, Hexagon, Hourglass, Octagon, Pentagon, Square, Triangle } from "lucide-react";
import { LogoCarousel } from "@/components/ui/logo-carousel/logo-carousel";

const BRANDS = [
  { id: "northwind", name: "Northwind", Icon: Triangle },
  { id: "halcyon", name: "Halcyon", Icon: Circle },
  { id: "fieldnote", name: "Fieldnote", Icon: Square },
  { id: "kestrel", name: "Kestrel", Icon: Diamond },
  { id: "lumen", name: "Lumen", Icon: Hexagon },
  { id: "orbital", name: "Orbital", Icon: Octagon },
  { id: "vertex", name: "Vertex", Icon: Pentagon },
  { id: "tempo", name: "Tempo", Icon: Hourglass },
];

const logos = BRANDS.map(({ id, name, Icon }) => ({
  id,
  name,
  logo: (
    <span className="flex items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
      <Icon className="size-5" strokeWidth={2.4} aria-hidden="true" />
      {name}
    </span>
  ),
}));

export function Default() {
  return (
    <div className="w-full max-w-2xl text-center">
      <p className="mb-6 text-sm text-muted-foreground">Trusted by product teams at</p>
      <LogoCarousel logos={logos} slots={4} className="max-sm:grid-cols-2" />
    </div>
  );
}

export function ThreeSlots() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface px-6 py-8">
      <LogoCarousel logos={logos} slots={3} interval={2200} stagger={0.18} label="Partners" />
    </div>
  );
}
