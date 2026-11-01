import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ConnectWalletButton } from "@/components/ui/connect-wallet-button/connect-wallet-button";

// Presentational: wire it to wagmi, viem or your own wallet layer.
<ConnectWalletButton
  status={status} // "disconnected" | "connecting" | "connected" | "error"
  wallets={[{ id: "harbor", name: "Harbor Wallet", recent: true }]}
  onConnect={(walletId) => connect(walletId)}
  address={account?.address}
  explorerUrl="https://etherscan.io"
  onDisconnect={disconnect}
/>`,
  a11y: [
    "The button opens a menu of wallets with full arrow-key navigation; Enter or Space picks one.",
    "Connecting sets aria-busy and blocks the menu, and every state change is announced through a polite live region.",
    "Once connected, the button is named after the account and opens a menu with Copy address, View on explorer and Disconnect.",
    "Reduced motion swaps the content with a plain fade, skips the width morph and drops the error shake.",
  ],
  notes: [
    "The component never talks to a wallet. Your wallet layer owns status and address; the component calls onConnect and onDisconnect.",
    "Wallet icons are generated from the wallet name and color. Pass iconUrl on a wallet to show its real logo.",
  ],
};
