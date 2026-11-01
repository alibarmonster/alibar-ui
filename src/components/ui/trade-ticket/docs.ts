import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TradeTicket } from "@/components/ui/trade-ticket/trade-ticket";

<TradeTicket
  market={market}
  choice="yes"
  balance={50000} // cents, simulated
  onTrade={(trade) => console.log(trade.shares, trade.price)}
/>`,
  a11y: [
    "Buy and Sell are tabs; Yes and No are a radio group whose labels include the price. The amount field, quick chips and limit stepper are all labelled controls.",
    "The submit button names the action (\"Buy Yes\", \"Insufficient balance\", \"Confirming…\") and announces changes politely. A failed order shows an alert with the reason.",
    "Price impact above 5% is flagged with an icon and a spoken \"high price impact\", not only with color.",
    "With reduced motion the check, confetti and shake are skipped; the states still change.",
  ],
  notes: [
    "Everything is simulated: a constant-product style curve gives the average price and impact, shares are amount ÷ price and pay $1 each, all in integer cents, basis points and hundredths of a share (lib/markets/math).",
    "The amount field is Token Amount Input with a simulated USDC balance (bigint, 6 decimals); Sell switches it to shares with your position as the max.",
    "Success draws a check, bursts a little confetti and adds a Transaction Toast. Pass layoutId to morph from a Market Card button.",
  ],
};
