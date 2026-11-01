"use client";

import { useState } from "react";
import { TransactionHistory } from "@/components/ui/transaction-history/transaction-history";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { getMockChain, mockTransactions } from "@/lib/web3/mock";

type Preview = "history" | "loading" | "empty";

export function Default() {
  const [preview, setPreview] = useState<Preview>("history");
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <TransactionHistory
        transactions={preview === "empty" ? [] : mockTransactions}
        loading={preview === "loading"}
        explorerUrl={getMockChain(1).explorerUrl}
      />
      <DemoStateSwitcher<Preview> states={["history", "loading", "empty"]} value={preview} onChange={setPreview} />
    </div>
  );
}

export function Scrollable() {
  return (
    <TransactionHistory
      className="max-h-80 overflow-y-auto"
      transactions={[...mockTransactions, ...mockTransactions.map((t) => ({ ...t, hash: `${t.hash.slice(0, -4)}beef` }))]}
      explorerUrl={getMockChain(1).explorerUrl}
    />
  );
}
