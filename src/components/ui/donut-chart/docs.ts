import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DonutChart } from "@/components/ui/donut-chart/donut-chart";

export function Sources() {
  return (
    <DonutChart
      label="Traffic sources"
      data={[
        { label: "Organic search", value: 18420 },
        { label: "Direct", value: 9310 },
        { label: "Referral", value: 6240 },
      ]}
    />
  );
}`,
  a11y: [
    "The legend shows every value and share as text, and a visually hidden table repeats them, so no segment depends on color or hover.",
    "The donut is one tab stop: arrow keys isolate each segment and announce its label, value and share.",
    "With reduced motion enabled, segments appear without the sweep and isolate without moving.",
  ],
  notes: [
    "For part-to-whole at a glance with a handful of parts. To compare close values, use a bar chart.",
    "Past `maxSegments` (default 5) the smallest parts fold into a gray “Other”, rather than inventing more colors.",
    "Colors follow each item's position in `data`, not its rank, so filtering never repaints the survivors. Segments are separated by a 2px gap, never a border.",
    "The sweep-in is a clip-path; data changes spring each segment's angles to their new values.",
  ],
};
