import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ContributionHeatmap } from "@/components/ui/contribution-heatmap/contribution-heatmap";

export function Activity({ days }: { days: { date: string; count: number }[] }) {
  return <ContributionHeatmap data={days} weeks={26} />;
}`,
  a11y: [
    "The grid is one tab stop: arrow keys move between days (left and right by week, up and down by day), and each day is announced through a live region.",
    "The caption gives the total as text, a visually hidden table gives monthly totals, and the scale legend runs from Less to More.",
    "With reduced motion enabled, cells fade in without scaling.",
  ],
  notes: [
    "A single-hue scale from light to dark; every filled step clears 2:1 against white, and empty days are a neutral fill.",
    "Levels default to quartiles of the non-zero days; pass `thresholds` for fixed buckets.",
    "Dates are handled in UTC, so server and client render the same grid. On narrow screens it scrolls horizontally and starts at the latest weeks.",
  ],
};
