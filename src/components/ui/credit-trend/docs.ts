import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CreditTrend } from "@/components/ui/credit-trend/credit-trend";

<CreditTrend
  categories={[{ id: "chat", name: "Chat & reasoning" }, { id: "agents", name: "Agent runs" }]}
  days={[
    { date: "2026-10-20", values: { chat: 6100, agents: 4700 } },
    // …one entry per day of the cycle; future days have empty values
    { date: "2026-11-18", values: {} },
  ]}
  today="2026-11-02"
  dailyBudget={16000}
  workflows={workflows}
/>`,
  a11y: [
    "The chart is one focusable group: the left and right arrow keys, Home and End move between days, and each day's total is announced politely. A visually hidden table lists every past day.",
    "Category chips are toggle buttons (aria-pressed) and double as the legend, so every color is paired with a name. The last enabled category cannot be turned off.",
    "The pace badge reads \"On pace\" or \"Over pace\", and workflow changes show ▲ or ▼ with the percentage, never color alone. With reduced motion, bars and numbers change without travel.",
  ],
  notes: [
    "Credits are integers. Used so far counts the whole cycle to today; the daily average uses the past days in the selected range, and the projection adds that average for each remaining day.",
    "Turning a category off re-stacks every bar and updates the tiles, the day card and the workflow list.",
    "Hover a workflow or a category chip to highlight that category in the chart.",
  ],
};
