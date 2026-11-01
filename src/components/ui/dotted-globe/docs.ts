import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DottedGlobe } from "@/components/ui/dotted-globe/dotted-globe";

<DottedGlobe
  markers={[{ lat: -6.2, lon: 106.8, label: "Jakarta" }]}
  arcs={[{ from: [-6.2, 106.8], to: [51.5, -0.1] }]}
/>`,
  a11y: [
    "The canvas is an image whose label names every marked place, so the locations aren't visual-only.",
    "Dragging is optional decoration; nothing needs the globe to be rotated.",
    "With reduced motion the globe draws once and stays still (dragging still works).",
  ],
  notes: [
    "About 2,600 Fibonacci-sphere points are filtered by a layered-sine land mask, so you get stylized continents without shipping map data. Swap isLand for a real mask if you need geography.",
    "Canvas 2D at up to 2× pixel ratio. It pauses offscreen and in hidden tabs, and drag uses pointer capture with a little inertia.",
  ],
};
