import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { NetworkSwitcher } from "@/components/ui/network-switcher/network-switcher";

<NetworkSwitcher
  chains={[{ id: 1, name: "Ethereum" }, { id: 8453, name: "Base" }]}
  chainId={walletChainId}
  switchingTo={pendingChainId}
  error={switchError}
  onSwitch={(id) => switchChain(id)}
/>`,
  a11y: [
    "The trigger opens a menu of networks as radio items (arrow keys to move, Enter to pick), with the current network checked.",
    "The trigger's name reflects the state (\"Network: Base\", \"Switching to Base\", \"Wrong network\"), and switching sets aria-busy.",
    "The wrong-network and error banner is announced as an alert, and its action button switches to the recommended network.",
    "The banner opens with the grid-rows height trick, so content below never jumps. Reduced motion removes the transition.",
  ],
  notes: [
    "A chainId that isn't in chains is treated as an unsupported network. Pass unsupportedChainName to name it in the warning.",
    "Network avatars are generated from the chain name and color. Pass iconUrl on a chain to use its real logo.",
  ],
};
