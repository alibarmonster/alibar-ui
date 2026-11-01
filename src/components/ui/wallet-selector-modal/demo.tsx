"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { WalletSelectorModal, type WalletSelectorView } from "@/components/ui/wallet-selector-modal/wallet-selector-modal";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { mockWallets } from "@/lib/web3/mock";

type PreviewState = "list" | "connecting" | "qr" | "error";

const trigger = (
  <button
    type="button"
    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none transition-colors hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    <Wallet className="size-4" aria-hidden="true" />
    Connect wallet
  </button>
);

export function Default() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewState>("list");
  const [selected, setSelected] = useState<string>(mockWallets[0].id);
  const [connected, setConnected] = useState<string>();
  const [simulating, setSimulating] = useState(false);

  // Picking a browser wallet "connects" after 1.4s and closes the dialog.
  useEffect(() => {
    if (!simulating) return;
    const timer = window.setTimeout(() => {
      setSimulating(false);
      setPreview("list");
      setConnected(selected);
      setOpen(false);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [simulating, selected]);

  const view: WalletSelectorView = preview === "qr" ? "qr" : "list";
  const status = preview === "connecting" ? "connecting" : preview === "error" ? "error" : "idle";

  return (
    <div className="flex flex-col items-center gap-5">
      <WalletSelectorModal
        open={open}
        onOpenChange={setOpen}
        trigger={trigger}
        wallets={mockWallets}
        selectedWalletId={preview === "qr" ? "relay" : selected}
        status={status}
        view={view}
        onViewChange={(next) => setPreview(next === "qr" ? "qr" : "list")}
        onSelect={(id) => {
          setSelected(id);
          if (!mockWallets.find((w) => w.id === id)?.qr) {
            setPreview("connecting");
            setSimulating(true);
          }
        }}
      />
      <p className="h-5 text-[13px] text-muted-foreground" role="status">
        {connected ? `Connected with ${mockWallets.find((w) => w.id === connected)?.name}` : "Pick a state, then open the dialog."}
      </p>
      <DemoStateSwitcher<PreviewState>
        states={[
          { value: "list", label: "Wallet list" },
          { value: "connecting", label: "Connecting" },
          { value: "qr", label: "QR code" },
          { value: "error", label: "Rejected" },
        ]}
        value={preview}
        onChange={(next) => {
          setSimulating(false);
          setPreview(next);
        }}
      />
    </div>
  );
}
