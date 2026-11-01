"use client";

import { DottedGlobe } from "@/components/ui/dotted-globe/dotted-globe";

const CITIES = [
  { lat: -6.2, lon: 106.8, label: "Jakarta" },
  { lat: 1.35, lon: 103.8, label: "Singapore" },
  { lat: 35.7, lon: 139.7, label: "Tokyo" },
  { lat: 51.5, lon: -0.1, label: "London" },
  { lat: 40.7, lon: -74, label: "New York" },
];

export function Default() {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <DottedGlobe
        markers={CITIES}
        arcs={[
          { from: [-6.2, 106.8], to: [35.7, 139.7] },
          { from: [-6.2, 106.8], to: [51.5, -0.1] },
          { from: [51.5, -0.1], to: [40.7, -74] },
        ]}
        label="Office locations"
      />
      <p className="text-[13px] text-muted-foreground">Drag to spin.</p>
    </div>
  );
}

export function Minimal() {
  return <DottedGlobe className="max-w-xs" dotColor="#2563EB" accentColor="#F59E0B" speed={14} draggable={false} markers={CITIES.slice(0, 2)} />;
}
