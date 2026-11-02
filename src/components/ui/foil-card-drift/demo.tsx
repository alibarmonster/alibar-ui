"use client";

import { FoilCardDrift } from "@/components/ui/foil-card-drift/foil-card-drift";

export function Default() {
  return (
    <FoilCardDrift
      cards={[
        { id: "obsidian", label: "Obsidian card with a foil globe", design: "obsidian" },
        { id: "sky", label: "Sky card with doodles, for Serena Lo", design: "sky", holder: "Serena Lo" },
        { id: "chrome", label: "Brushed chrome card", design: "chrome" },
        { id: "lime", label: "Lime grid card", design: "lime" },
      ]}
    />
  );
}

export function Custom() {
  return (
    <FoilCardDrift
      speed={-30}
      cardWidth={240}
      cards={[
        { id: "a", label: "Studio card", children: <div className="absolute inset-0 bg-[linear-gradient(135deg,#1d4ed8,#7c3aed)] p-4 text-[13px] font-semibold text-white">Studio</div> },
        { id: "b", label: "Night card", design: "obsidian" },
        { id: "c", label: "Field card", children: <div className="absolute inset-0 bg-[linear-gradient(135deg,#f59e0b,#ef4444)] p-4 text-[13px] font-semibold text-white">Field</div> },
      ]}
    />
  );
}
