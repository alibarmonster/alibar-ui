import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TokenSwapWidget } from "@/components/ui/token-swap-widget/token-swap-widget";

<TokenSwapWidget
  tokens={tokens}
  balances={balances}
  getQuote={(from, to, amountIn) => quotes.get(from, to, amountIn)} // { amountOut, minimumOut, rate, priceImpactBps, … }
  quoteLoading={isFetching}
  onQuoteRefresh={refetch}
  approval={allowanceOk ? "approved" : approving ? "pending" : "required"}
  onApprove={(token, amount) => approve(token, amount)}
  status={status} // "idle" | "swapping" | "success" | "failed"
  onSwap={({ from, to, amountIn, quote }) => swap(from, to, amountIn, quote.minimumOut)}
  slippageBps={slippage}
  onSlippageChange={setSlippage}
/>`,
  a11y: [
    "Both sides are labelled Token Amount Inputs; the receive side is read-only and aria-busy while a quote loads.",
    "The flip button is named after what it does (\"Switch: pay with USDC instead\") and rotates while the panels trade places.",
    "The main button names its exact stage (Enter an amount, Insufficient balance, Approve, Swap…), and busy, done and error stages are announced through a live region.",
    "The rate line toggles the inverse rate; details open with the grid-rows trick. High price impact shows an alert with text and an icon.",
    "Reduced motion turns the flip, label swaps and panel move into instant changes or fades.",
  ],
  notes: [
    "Reuses Token Amount Input, Token Selector Modal and Slippage Settings, so they install with it.",
    "Everything is bigint: amounts, rate, minimum received and the inverse rate. The quote countdown restarts whenever tokens or the amount change.",
    "The widget never signs anything. Drive approval and status from your wallet layer; returning status from \"success\" to \"idle\" clears the amount.",
  ],
};
