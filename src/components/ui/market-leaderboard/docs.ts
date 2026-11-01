import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MarketLeaderboard } from "@/components/ui/market-leaderboard/market-leaderboard";

<MarketLeaderboard
  data={{ week, month, all }} // [{ trader, profit, volume, accuracy, change }]
  currentUser="@alibar"
/>`,
  a11y: [
    "The period is a tab list and the ranking metric is a radio group. Ranks are real ordered lists, and the podium includes a spoken \"Rank\" before each number.",
    "Rank changes read \"▲2 places up\" / \"▼1 places down\", so direction never depends on color. The viewer's pinned row is labelled \"(you)\".",
    "With reduced motion the podium rise and list re-sort are instant.",
  ],
  notes: [
    "Profit and volume are cents, accuracy is basis points. Rows re-sort by the selected metric with a layout animation.",
    "If the current user is outside the visible list, their row is pinned at the bottom with their real rank.",
    "Leaderboard data in the demo is simulated.",
  ],
};
