"use client";

import { useEffect, useState } from "react";
import { ConnectWalletButton, type ConnectStatus } from "@/components/ui/connect-wallet-button/connect-wallet-button";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { getMockChain, mockAccount, mockWallets } from "@/lib/web3/mock";

/** Simulates a wallet: picking one connects after 1.4s. States chosen in the switcher stay put. */
function useMockConnection(initial: ConnectStatus = "disconnected") {
  const [status, setStatus] = useState<ConnectStatus>(initial);
  const [walletId, setWalletId] = useState<string>();
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (status !== "connecting" || !simulating) return;
    const timer = window.setTimeout(() => setStatus("connected"), 1400);
    return () => window.clearTimeout(timer);
  }, [status, simulating]);

  return {
    status,
    walletId,
    setStatus: (next: ConnectStatus) => {
      setSimulating(false);
      setStatus(next);
    },
    connect: (id: string) => {
      setWalletId(id);
      setSimulating(true);
      setStatus("connecting");
    },
  };
}

export function Default() {
  const { status, walletId, setStatus, connect } = useMockConnection();
  return (
    <div className="flex flex-col items-center gap-8">
      <ConnectWalletButton
        status={status}
        wallets={mockWallets}
        onConnect={connect}
        connectingWalletId={walletId ?? mockWallets[0].id}
        address={mockAccount.address}
        explorerUrl={getMockChain(1).explorerUrl}
        onDisconnect={() => setStatus("disconnected")}
      />
      <DemoStateSwitcher states={["disconnected", "connecting", "connected", "error"]} value={status} onChange={setStatus} />
    </div>
  );
}

export function InNavbar() {
  const { status, walletId, setStatus, connect } = useMockConnection("connected");
  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between gap-4 border-b border-border px-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="size-6 rounded-md bg-foreground" aria-hidden="true" />
          Tidepool
        </span>
        <ConnectWalletButton
          status={status}
          wallets={mockWallets}
          onConnect={connect}
          connectingWalletId={walletId}
          address={mockAccount.address}
          name={mockAccount.label}
          explorerUrl={getMockChain(1).explorerUrl}
          onDisconnect={() => setStatus("disconnected")}
        />
      </div>
      <div className="space-y-2 p-4" aria-hidden="true">
        <div className="h-3 w-2/3 rounded-full bg-muted" />
        <div className="h-3 w-1/2 rounded-full bg-muted" />
      </div>
    </div>
  );
}
