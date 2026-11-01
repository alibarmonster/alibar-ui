import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LiquidityPoolCard } from "@/components/ui/liquidity-pool-card/liquidity-pool-card";

<LiquidityPoolCard
  tokenA={{ symbol: "ETH", decimals: 18 }}
  tokenB={{ symbol: "USDC", decimals: 6 }}
  feeBps={30}
  tvl={pool.tvlUsd} // bigint, 8 decimals
  aprBps={1240}
  price={pool.price} // USDC per ETH
  onAddLiquidity={([min, max]) => openPosition(min, max)}
/>`,
  a11y: [
    "Add liquidity is a disclosure button (aria-expanded); the collapsed panel is inert so Tab skips it.",
    "The range uses Range Slider with two named thumbs (\"Minimum price, USDC per ETH\"), so both ends work with arrow keys.",
    "In-range status is text and a dot, never color alone, and the fee tier reads as \"0.3% fee tier\".",
    "The panel opens with the grid-rows trick. Reduced motion makes it instant and the confirm label swaps with a fade.",
  ],
  notes: [
    "Money values (TVL, volume) are bigint USD with 8 decimals. Prices for the range are display numbers, since they only drive geometry and labels.",
    "The estimated APR scales with how concentrated the range is (capped at 10× full range) and drops to zero out of range. Swap in your own estimator if your protocol computes it differently.",
  ],
};
