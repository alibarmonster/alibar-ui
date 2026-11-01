import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { WalletSelectorModal } from "@/components/ui/wallet-selector-modal/wallet-selector-modal";

<WalletSelectorModal
  trigger={<button>Connect wallet</button>}
  wallets={wallets} // { id, name, iconUrl?, recent?, installed?, qr? }[]
  selectedWalletId={pendingId}
  status={status} // "idle" | "connecting" | "error"
  onSelect={(id) => connect(id)}
  qrValue={walletConnectUri}
  renderQrCode={(value) => <YourQrCode value={value} />}
/>`,
  a11y: [
    "Built on Radix Dialog: focus moves into the dialog, stays trapped while it's open and returns to the trigger on close. Escape closes it.",
    "Each wallet is a button in a list; the one connecting sets aria-busy, and connecting or rejected states are announced through a live region.",
    "The QR view has a labelled Back button and a Copy link fallback for people who can't scan.",
    "Reduced motion replaces the slide and height morph with a cross-fade.",
  ],
  notes: [
    "The built-in QR pattern is decorative and can't be scanned. Pass renderQrCode to draw a real code with the QR library you already use.",
    "Wallets with qr: true open the QR view when picked; other wallets only call onSelect, so your wallet layer decides what happens next.",
  ],
};
