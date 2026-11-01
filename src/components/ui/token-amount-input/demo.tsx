"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { TokenAmountInput } from "@/components/ui/token-amount-input/token-amount-input";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { parseAmount } from "@/lib/web3/format";
import { getMockToken, mockBalances, mockQuote } from "@/lib/web3/mock";

const eth = getMockToken("ETH");
const usdc = getMockToken("USDC");
type Preview = "empty" | "valid" | "insufficient" | "loading";
const PRESET: Record<Preview, string> = { empty: "", valid: "0.75", insufficient: "4.2", loading: "0.75" };

export function Default() {
  const [preview, setPreview] = useState<Preview>("empty");
  const [value, setValue] = useState("");
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <TokenAmountInput
        className="w-full"
        label="You pay"
        token={eth}
        balance={mockBalances.ETH}
        value={value}
        onValueChange={setValue}
        loading={preview === "loading"}
      />
      <DemoStateSwitcher<Preview>
        states={["empty", "valid", "insufficient", "loading"]}
        value={preview}
        onChange={(next) => {
          setPreview(next);
          setValue(PRESET[next]);
        }}
      />
    </div>
  );
}

export function PayAndReceive() {
  const [value, setValue] = useState("0.5");
  const amountIn = parseAmount(value, eth.decimals);
  const amount = amountIn ? mockQuote(eth, usdc, amountIn) : null;
  return (
    <div className="w-full max-w-md space-y-1.5">
      <TokenAmountInput label="You pay" token={eth} balance={mockBalances.ETH} value={value} onValueChange={setValue} />
      <TokenAmountInput
        label="You receive"
        token={usdc}
        value={amount ? formatUnits(amount.amountOut, 6) : ""}
        readOnly
        percentages={[]}
      />
    </div>
  );
}
