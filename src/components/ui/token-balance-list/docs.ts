import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TokenBalanceList } from "@/components/ui/token-balance-list/token-balance-list";

<TokenBalanceList
  items={[
    { token: { symbol: "ETH", name: "Ether", decimals: 18, price: ethPrice }, balance: ethBalance, change24h: 0.021 },
  ]}
  defaultHideSmallBalances
/>`,
  a11y: [
    "\"Hide small balances\" is a labelled switch (role=\"switch\" with aria-checked) that shows how many rows it hides.",
    "The 24h change uses an arrow icon and a +/- sign as well as color, and adds \"in 24 hours\" for screen readers.",
    "Loading rows are marked aria-busy, and their pulse stops with reduced motion.",
    "Rows stagger in and slide into place when the filter changes. Reduced motion makes both instant fades.",
  ],
  notes: [
    "USD values are computed as bigint (balance × price) with 8-decimal prices, then formatted. Nothing is converted to a float.",
    "Tokens without a price show \"—\" and sort last, and the default small-balance threshold is $1 (smallBalanceThreshold).",
  ],
};
