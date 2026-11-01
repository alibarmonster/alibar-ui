import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { StatCard } from "@/components/ui/stat-card/stat-card";

export function Revenue() {
  return (
    <StatCard
      label="Revenue"
      value={57400}
      previous={52800}
      comparison="vs last week"
      trend={[38200, 39100, 41400, 40200, 43800, 45100, 44600, 47900, 49200, 48100, 51600, 57400]}
    />
  );
}`,
  a11y: [
    "The final value is read from a visually hidden copy; the counting digits are aria-hidden.",
    "The delta pairs color with an arrow and a signed percentage, and says “Up” or “Down” to screen readers; its color follows goodDirection.",
    "The trend has a text summary (period count, low and high). With reduced motion enabled, values change without counting and the trend appears without drawing on.",
  ],
  notes: [
    "Follows the stat tile pattern: label, value (proportional figures, auto-compact above 10,000), signed delta against a named period, and an optional trend.",
    "The trend is drawn in a neutral gray with only the current period in the accent, so it supports the number instead of competing with it.",
    "Changing `value` counts from the old number; the trend morphs and the delta badge swaps with a short blur.",
  ],
};
