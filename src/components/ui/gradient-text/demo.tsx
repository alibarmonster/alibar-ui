"use client";

import { GradientText } from "@/components/ui/gradient-text/gradient-text";

export function Default() {
  return (
    <p className="max-w-lg text-center text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
      Interfaces that feel <GradientText>alive</GradientText>
    </p>
  );
}

const PALETTES = [
  { name: "Sunset", colors: ["#EA580C", "#DB2777", "#9333EA"] },
  { name: "Lagoon", colors: ["#0891B2", "#2563EB", "#059669"] },
  { name: "Graphite", colors: ["#09090B", "#71717A", "#09090B"] },
];

export function Palettes() {
  return (
    <ul className="space-y-2 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
      {PALETTES.map((palette, i) => (
        <li key={palette.name}>
          <GradientText colors={palette.colors} duration={6 + i * 2}>
            {palette.name}
          </GradientText>
        </li>
      ))}
    </ul>
  );
}

export function Inline() {
  return (
    <p className="max-w-md text-center text-base leading-relaxed text-muted-foreground">
      Use it sparingly. One phrase like{" "}
      <GradientText className="font-semibold" duration={5}>
        priced for teams of every size
      </GradientText>{" "}
      draws the eye; a whole paragraph of it just tires it.
    </p>
  );
}
