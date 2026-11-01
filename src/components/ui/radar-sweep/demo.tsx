"use client";

import { RadarSweep } from "@/components/ui/radar-sweep/radar-sweep";

export function Default() {
  return (
    <RadarSweep
      label="Nearby devices"
      blips={[
        { angle: 35, distance: 0.55, label: "Maya's laptop" },
        { angle: 120, distance: 0.8, label: "Studio speaker" },
        { angle: 200, distance: 0.35, label: "Raka's phone" },
        { angle: 290, distance: 0.7, label: "Printer" },
      ]}
    />
  );
}

export function Scanning() {
  return (
    <div className="flex flex-col items-center gap-3">
      <RadarSweep className="max-w-48" color="#16A34A" duration={2.5} rings={3} label="Scanning for networks" />
      <p className="text-[13px] text-muted-foreground">Scanning for networks…</p>
    </div>
  );
}
