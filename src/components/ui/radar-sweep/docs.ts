import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RadarSweep } from "@/components/ui/radar-sweep/radar-sweep";

<RadarSweep blips={[{ angle: 35, distance: 0.55, label: "Maya's laptop" }]} label="Nearby devices" />`,
  a11y: [
    "The radar is a single labelled image that lists its contacts, so screen readers get the information without the animation.",
    "With reduced motion the sweep holds still and every blip stays softly lit.",
  ],
  notes: [
    "Pure CSS: the sweep is a rotating conic gradient, and each blip runs the same-length fade cycle with a negative delay, so it flashes exactly as the sweep crosses its bearing. The keyframes ship inside the component through a React 19 hoisted <style>.",
  ],
};
