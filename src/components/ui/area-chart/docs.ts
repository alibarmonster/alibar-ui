import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AreaChart } from "@/components/ui/area-chart/area-chart";

export function Traffic() {
  return (
    <AreaChart
      label="Visitors by device"
      labels={["Jan", "Feb", "Mar", "Apr"]}
      series={[
        { id: "desktop", label: "Desktop", values: [4200, 4630, 5120, 4980] },
        { id: "mobile", label: "Mobile", values: [3100, 3480, 3920, 4410] },
      ]}
    />
  );
}`,
  a11y: [
    "A visually hidden table holds every value for every series.",
    "The chart is one tab stop: left and right arrows move the crosshair between points, and the tooltip's contents are announced through a live region.",
    "With reduced motion enabled, lines appear without drawing on and the crosshair moves without easing.",
  ],
  notes: [
    "One value axis, always starting at zero. Put measures with different units in separate charts rather than adding a second axis.",
    "The crosshair snaps to the nearest x, and one tooltip lists every series there, value first. A legend appears from two series up.",
    "Lines draw on with a clip-path reveal and morph when the data changes (keep the point count the same for a smooth morph). Curves are monotone, so they never overshoot the data.",
    "Series colors default to --chart-1…3 by position; pass `color` per series if series can be toggled, so each keeps its color.",
  ],
};
