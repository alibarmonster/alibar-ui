import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TransactionReviewModal } from "@/components/ui/transaction-review-modal/transaction-review-modal";

<TransactionReviewModal
  trigger={<button>Review swap</button>}
  status={status} // "idle" → "awaiting-signature" → "pending" → "confirmed" | "failed"
  assets={[
    { label: "You pay", token: eth, amount: amountIn },
    { label: "You receive", token: usdc, amount: amountOut },
  ]}
  details={[{ label: "Network fee", value: "0.0018 ETH" }]}
  onConfirm={() => sendTransaction()}
  txHash={hash}
  explorerUrl="https://etherscan.io"
/>`,
  a11y: [
    "Built on Radix Dialog with focus trapping and focus return. The title changes with each step, and a live region announces it.",
    "Irreversible actions need a deliberate hold on Hold to Confirm, which also works with the keyboard (hold Space or Enter).",
    "Warnings are announced as alerts and carry an icon and text, never color alone.",
    "Reduced motion swaps steps with a fade, draws the check instantly and replaces spinners with a soft pulse.",
  ],
  notes: [
    "The modal never sends anything itself: onConfirm is where you request the signature, and you drive status from your wallet layer.",
    "Amounts are bigint values formatted with their token decimals, and USD values are bigint with 8 decimals.",
  ],
};
