import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TransactionHistory } from "@/components/ui/transaction-history/transaction-history";

<TransactionHistory
  transactions={txs} // { hash, type, status, timestamp, from, to, summary, amount?, fee }[]
  explorerUrl="https://etherscan.io"
  timeZone="UTC"
/>`,
  a11y: [
    "Each row is a button with aria-expanded and aria-controls; its details panel is inert while collapsed, so Tab skips hidden links.",
    "Status is never color-only: pending shows a spinner and the word \"Pending\", failed shows \"Failed\", and confirmed has screen-reader text.",
    "Day groups are labelled groups, and their sticky labels stay visible while the list scrolls.",
    "Details open with the grid-rows height trick. Reduced motion makes it instant, and the pending spinner turns into a soft pulse.",
  ],
  notes: [
    "Dates are grouped and formatted in a fixed time zone (UTC by default) so server and client render the same output. Pass your user's time zone if you render on the client only.",
    "From and To reuse Address Pill, and the hash row reuses Copy Button, so copy and explorer behave the same everywhere.",
  ],
};
