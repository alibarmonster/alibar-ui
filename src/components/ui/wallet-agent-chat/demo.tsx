"use client";

import { useRef } from "react";
import { WalletAgentChat } from "@/components/ui/wallet-agent-chat/wallet-agent-chat";
import type { AgentToken } from "@/lib/usage/wallet-agent";
import { mockContacts, mockStarterPrompts } from "@/lib/usage/mock";
import { mockAccount, mockBalances, mockTokens, totalUsd } from "@/lib/web3/mock";

// Simulated wallet: the web3 mock tokens with their mock balances. No wallet, RPC or signing.
const tokens: AgentToken[] = mockTokens.map((t) => ({ ...t, balance: mockBalances[t.symbol] ?? BigInt(0) }));
const balanceUsd = totalUsd();

export function Default() {
  return (
    <WalletAgentChat
      agentName="Atlas"
      address={mockAccount.address}
      balanceUsd={balanceUsd}
      contacts={mockContacts}
      tokens={tokens}
      starterPrompts={mockStarterPrompts}
      explorerUrl="https://etherscan.io"
    />
  );
}

/** The wallet rejects the first approval, so the card shows Failed with Retry; the retry succeeds. */
export function Failure() {
  const attempts = useRef(0);
  return (
    <WalletAgentChat
      agentName="Atlas"
      address={mockAccount.address}
      balanceUsd={balanceUsd}
      contacts={mockContacts}
      tokens={tokens}
      starterPrompts={[
        { title: "Pay a contact", prompt: "Send 120 USDC to Maya" },
        { title: "Unlimited allowance", prompt: "Approve unlimited USDC for Tidepool Router" },
        { title: "Too large", prompt: "Swap 40 ETH to USDC" },
      ]}
      onApprove={() =>
        new Promise<void>((resolve, reject) => {
          attempts.current += 1;
          window.setTimeout(() => (attempts.current % 2 === 1 ? reject(new Error("Request rejected in the wallet.")) : resolve()), 900);
        })
      }
    />
  );
}
