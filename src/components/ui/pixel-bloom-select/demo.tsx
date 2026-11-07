"use client";

import { useState } from "react";
import { PixelBloomSelect } from "@/components/ui/pixel-bloom-select/pixel-bloom-select";

export function Default() {
  return <PixelBloomSelect />;
}

export function Controlled() {
  const [vibe, setVibe] = useState("ember-choir");
  return (
    <div className="flex flex-col items-center gap-3">
      <PixelBloomSelect value={vibe} onValueChange={setVibe} pixelSize={5} />
      <p className="font-mono text-[12px] text-muted-foreground">value: {vibe}</p>
    </div>
  );
}

export function CustomPalettes() {
  return (
    <PixelBloomSelect
      label="Season"
      defaultValue="late-summer"
      pixelSize={3}
      options={[
        { value: "first-frost", label: "First Frost", palette: ["#0f2b3d", "#3d7ea6", "#a7d3f0", "#f4fbff"] },
        { value: "late-summer", label: "Late Summer", palette: ["#3b1f0b", "#b8641c", "#f2b33d", "#fff1c2"] },
        { value: "spring-rain", label: "Spring Rain", palette: ["#13311e", "#2e7d4f", "#8fd18a", "#effbe7"] },
        { value: "autumn-smoke", label: "Autumn Smoke", palette: ["#2a1810", "#7a3b26", "#c97b54", "#f3dccb"] },
      ]}
    />
  );
}
