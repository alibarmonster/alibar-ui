import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { WalletAgentChat } from "@/components/ui/wallet-agent-chat/wallet-agent-chat";

<WalletAgentChat
  agentName="Atlas"
  address={account.address}
  balanceUsd={totalUsd} // bigint, 8 decimals
  tokens={tokens} // { symbol, decimals, price, balance: bigint }[]
  contacts={[{ name: "Maya", address: "0x…" }]}
  starterPrompts={[{ title: "Swap tokens", prompt: "Swap 0.5 ETH to USDC" }]}
  onApprove={async (card) => {
    // Hand the card to your own wallet flow here. Resolve with a tx hash, or throw to show Failed.
  }}
/>`,
  a11y: [
    "The conversation is a labelled region. Each reply is announced politely once it finishes, along with each card's status changes (awaiting signature, pending, confirmed, failed, cancelled).",
    "Every action card is an article with its amounts, fees and spender in text; the unlimited-allowance warning is an alert with a keyboard-reachable \"Cap at your balance\" action.",
    "The pending ring is a progressbar with its value. Reduced motion keeps every state but drops the slide-in, shake and check draw.",
  ],
  notes: [
    "Simulated by default: replies come from useMockWalletAgent in src/lib/usage/wallet-agent.ts, which parses \"swap X A to B\", \"send X A to name\" and \"approve X A for spender\" with regular expressions. Pass `agent` to plug in your own.",
    "Nothing is signed without an explicit click on the card's approve button, and Cancel is available until the signature resolves. Payments only go to saved contacts.",
    "All token amounts are bigint with their decimals; USD values use 8 decimals. Swap quotes refresh every 15 seconds while under review, and confirmed actions roll the header balance down.",
  ],
};
