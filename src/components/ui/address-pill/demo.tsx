"use client";

import { useState } from "react";
import { AddressPill } from "@/components/ui/address-pill/address-pill";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { getMockChain, mockAccount, mockAddress } from "@/lib/web3/mock";

const explorerUrl = getMockChain(1).explorerUrl;

export function Default() {
  const [state, setState] = useState<"address" | "name" | "loading">("address");
  return (
    <div className="flex flex-col items-center gap-6">
      <AddressPill
        address={mockAccount.address}
        name={state === "name" ? mockAccount.label : undefined}
        loading={state === "loading"}
        explorerUrl={explorerUrl}
      />
      <DemoStateSwitcher states={["address", "name", "loading"]} value={state} onChange={setState} />
    </div>
  );
}

const SIGNERS = [
  { label: "Treasury", address: mockAddress("signer:treasury") },
  { label: "Operations", address: mockAddress("signer:ops") },
  { label: "Design", address: mockAddress("signer:design") },
];

export function SignerList() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Vault signers</p>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">2 of 3</span>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {SIGNERS.map((signer) => (
          <li key={signer.label} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-[13px] text-muted-foreground">{signer.label}</span>
            <AddressPill address={signer.address} size="sm" explorerUrl={explorerUrl} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Minimal() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <AddressPill address={mockAddress("contract:router")} showAvatar={false} copyable={false} />
      <AddressPill address={mockAddress("contract:router")} truncate={{ start: 10, end: 8 }} />
      <AddressPill address={mockAccount.address} name={mockAccount.label} size="sm" copyable={false} />
    </div>
  );
}
