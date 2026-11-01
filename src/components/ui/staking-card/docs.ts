import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { StakingCard } from "@/components/ui/staking-card/staking-card";

<StakingCard
  token={{ symbol: "USDC", decimals: 6, price: usdcPrice }}
  apyBps={840}
  staked={position.staked}
  balance={walletBalance}
  rewards={position.pendingRewards} // the counter ticks up from here
  status={status} // "idle" | "staking" | "unstaking" | "claiming" | "claimed"
  onStake={(amount) => stake(amount)}
  onUnstake={(amount) => unstake(amount)}
  onClaim={claim}
/>`,
  a11y: [
    "Stake and Unstake are tabs with a sliding indicator; the amount slider is Range Slider, so it works with arrow keys and has a named thumb.",
    "The action button always says what it will do (\"Stake 920.26 USDC\"), and busy and claimed states are announced through a live region.",
    "The live rewards counter rolls its digits without color flashes so it doesn't distract; screen readers get plain text.",
    "Reduced motion skips the claim burst, moves the tab indicator instantly and stops the digit reels.",
  ],
  notes: [
    "Rewards accrue client-side as staked × APY ÷ seconds per year, all in bigint. Pass fresh rewards from your contract to resync; the counter restarts from the new value.",
    "Reuses Range Slider for the amount, so it installs with it.",
  ],
};
