import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { StatsSection } from "@/components/ui/stats-section/stats-section";

<StatsSection
  title="Built for teams that ship"
  stats={[{ value: 38, suffix: "%", label: "Faster launches" }]}
/>`,
  a11y: [
    "Stats are a description list: each label is a dt and its value a dd, read in a sensible order even though the number is shown first.",
    "Number Ticker exposes the final value as text, so screen readers never hear the count-up.",
    "Counting starts when the section scrolls into view. With reduced motion the final values show immediately.",
  ],
  notes: [
    "Hairlines come from a 1px gap over the border color. Two columns become four at a 44rem container width.",
    "Reuses Number Ticker, so it installs with it.",
  ],
};
