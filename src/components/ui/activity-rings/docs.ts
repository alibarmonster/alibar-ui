import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ActivityRings } from "@/components/ui/activity-rings/activity-rings";

export function Today() {
  return (
    <ActivityRings
      rings={[
        { label: "Steps", value: 8240, goal: 10000 },
        { label: "Active", value: 46, goal: 30, unit: "min" },
        { label: "Water", value: 5, goal: 8, unit: "glasses" },
      ]}
    />
  );
}`,
  a11y: [
    "The rings are decorative; the legend lists each ring's value, goal and percentage as text. Without the legend, give the group a label that spells them out.",
    "With reduced motion enabled, rings appear filled to their values without sweeping.",
  ],
  notes: [
    "A ring past its goal keeps going round; the second lap's tip casts a small shadow so the overlap reads.",
    "Colors default to --chart-1…4 from the outside in. Rings are staggered as they fill.",
  ],
};
