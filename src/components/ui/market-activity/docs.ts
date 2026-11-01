import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MarketActivity } from "@/components/ui/market-activity/market-activity";

<MarketActivity
  trades={trades} // newest first: { id, trader, side, outcome, shares, price, at }
  comments={comments}
  currentUser="@alibar"
  onComment={(text, parentId) => save(text, parentId)}
/>`,
  a11y: [
    "Activity and Comments are tabs with arrow-key support. New trades are announced politely as they arrive.",
    "Buy and sell are written as \"bought\"/\"sold\" as well as colored; large trades carry a \"Large\" label.",
    "Like buttons are toggles (aria-pressed) with the count in their label. Reply buttons report aria-expanded and focus the reply field. Posting announces \"Comment posted\".",
    "Holder filters are a radio group and Sort is a native select. With reduced motion items appear without sliding.",
  ],
  notes: [
    "Trades worth at least largeTrade cents (default $500) are highlighted. Relative times render after hydration from a shared clock.",
    "The thread keeps its own copy of comments for likes, replies (one level) and new posts; Top sorts by likes, Newest keeps posting order.",
    "Position badges (\"Holds Yes · 340 shares\") come from each comment's position; trade and comment data in the demo are simulated.",
  ],
};
