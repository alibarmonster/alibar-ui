"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { TokenSelectorModal } from "@/components/ui/token-selector-modal/token-selector-modal";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { TokenIcon } from "@/lib/web3/icons";
import type { Token } from "@/lib/web3/types";
import { getMockToken, mockBalances, mockTokens, popularTokenSymbols } from "@/lib/web3/mock";

type Preview = "balances" | "no balances" | "loading";

export function Default() {
  const [token, setToken] = useState<Token>(getMockToken("ETH"));
  const [preview, setPreview] = useState<Preview>("balances");
  return (
    <div className="flex flex-col items-center gap-5">
      <TokenSelectorModal
        tokens={mockTokens}
        balances={preview === "balances" ? mockBalances : {}}
        popular={popularTokenSymbols}
        selected={token.symbol}
        loading={preview === "loading"}
        onSelect={setToken}
        trigger={
          <button
            type="button"
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-background py-1 pr-3 pl-1.5 text-sm font-semibold text-foreground shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <TokenIcon token={token} size={30} />
            <span>
              <span className="sr-only">Change token, </span>
              {token.symbol}
              <span className="sr-only"> selected</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          </button>
        }
      />
      <p className="text-[13px] text-muted-foreground">Arrow keys move through the list; Enter picks. Search &ldquo;zzz&rdquo; for the empty state.</p>
      <DemoStateSwitcher<Preview> states={["balances", "no balances", "loading"]} value={preview} onChange={setPreview} />
    </div>
  );
}
