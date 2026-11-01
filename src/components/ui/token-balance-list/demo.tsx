"use client";

import { useState } from "react";
import { TokenBalanceList, type TokenBalance } from "@/components/ui/token-balance-list/token-balance-list";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { mockBalances, mockTokens } from "@/lib/web3/mock";

const ITEMS: TokenBalance[] = mockTokens
  .filter((t) => (mockBalances[t.symbol] ?? BigInt(0)) > BigInt(0))
  .map((token) => ({ token, balance: mockBalances[token.symbol], change24h: token.change24h }));

type Preview = "loaded" | "loading" | "empty";

export function Default() {
  const [preview, setPreview] = useState<Preview>("loaded");
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <TokenBalanceList
        key={preview}
        items={preview === "empty" ? [] : ITEMS}
        loading={preview === "loading"}
        defaultHideSmallBalances
      />
      <DemoStateSwitcher<Preview> states={["loaded", "loading", "empty"]} value={preview} onChange={setPreview} />
    </div>
  );
}

export function Compact() {
  return <TokenBalanceList title="Stablecoins" items={ITEMS.filter((i) => ["USDC", "USDT", "DAI"].includes(i.token.symbol))} className="max-w-sm" />;
}
