import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ProbabilityChart } from "@/components/ui/probability-chart/probability-chart";

<ProbabilityChart
  market={market} // market.history: [{ t, prices: [bps, ...] }]
  defaultTimeframe="1W"
  annotations={[{ t: Date.UTC(2026, 9, 12), label: "Supplier report" }]}
/>`,
  a11y: [
    "Timeframes are a tab list and the legend entries are toggle buttons (aria-pressed), so every series can be hidden or shown from the keyboard.",
    "The plot is focusable: ←/→ move the crosshair point by point, Home/End jump to the ends and Escape clears it. The value under the crosshair is announced politely.",
    "A visually hidden table lists the sampled values, so the data is readable without the chart. Series are named in the legend and tooltip, never by color alone.",
    "With reduced motion the line morph and the pulsing live point are skipped.",
  ],
  notes: [
    "Lines are resampled to a fixed number of points, so switching timeframe morphs the path instead of redrawing it.",
    "Prices are basis points. Binary markets draw the Yes line; multi-outcome markets draw up to five outcomes using the --chart-1…5 tokens.",
    "Date labels render after hydration, because demo data is generated relative to page load.",
  ],
};
