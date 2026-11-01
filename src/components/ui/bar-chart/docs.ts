import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BarChart } from "@/components/ui/bar-chart/bar-chart";

export function Revenue() {
  return (
    <BarChart
      label="Monthly revenue"
      data={[
        { label: "Jan", value: 18.2 },
        { label: "Feb", value: 21.4 },
        { label: "Mar", value: 19.8 },
      ]}
    />
  );
}

// Ranked bars that re-sort as data changes
<BarChart label="Points by team" orientation="horizontal" sort="descending" data={teams} />`,
  a11y: [
    "A visually hidden table lists every value, so nothing depends on hovering.",
    "The chart is one tab stop: arrow keys move between bars, Home and End jump to the ends, and each bar's label and value are announced through a live region.",
    "With reduced motion enabled, bars appear at full height and re-sorting doesn't animate.",
  ],
  notes: [
    "Bars grow with clip-path (inset with a 4px rounded top), so the data end stays rounded and the baseline square without scale distortion. Bars never exceed 24px wide.",
    "One series uses one color. `highlight` keeps one bar in color and turns the rest neutral, which is usually better than coloring every bar.",
    "Vertical charts use clean ticks (1, 2, 2.5 or 5 × 10ⁿ), compact once the axis reaches 10,000. Horizontal bars label each value at the tip instead of drawing an axis.",
  ],
};
