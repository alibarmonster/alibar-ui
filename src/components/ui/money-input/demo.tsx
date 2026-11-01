"use client";

import { useState } from "react";
import { MoneyInput } from "@/components/ui/money-input/money-input";

export function Default() {
  const [amount, setAmount] = useState<number | null>(1250);
  return (
    <div className="w-full max-w-sm space-y-2">
      <label htmlFor="amount-usd" className="text-sm font-medium text-foreground">
        Amount
      </label>
      <MoneyInput id="amount-usd" size="lg" value={amount} onValueChange={setAmount} max={1_000_000} />
      <p className="font-mono text-xs text-muted-foreground tabular-nums">value: {amount === null ? "null" : amount}</p>
    </div>
  );
}

export function Rupiah() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <label htmlFor="amount-idr" className="text-sm font-medium text-foreground">
        Nominal transfer
      </label>
      <MoneyInput id="amount-idr" size="lg" currency="IDR" locale="id-ID" defaultValue={1500000} />
    </div>
  );
}

export function Euro() {
  return (
    <div className="w-full max-w-xs space-y-2">
      <label htmlFor="amount-eur" className="text-sm font-medium text-foreground">
        Monthly budget
      </label>
      <MoneyInput id="amount-eur" currency="EUR" locale="de-DE" defaultValue={2400.5} />
      <p className="text-[13px] text-muted-foreground">German locale: the symbol trails and the comma is the decimal separator.</p>
    </div>
  );
}
