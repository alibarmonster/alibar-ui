import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AddressPill } from "@/components/ui/address-pill/address-pill";

export function Owner({ address }: { address: \`0x\${string}\` }) {
  return <AddressPill address={address} explorerUrl="https://etherscan.io" />;
}`,
  a11y: [
    "The copy button is named \"Copy address 0x1234…abcd\" and confirms with a check icon and a polite status message.",
    "The explorer link is named \"View on block explorer\" and opens in a new tab. Both buttons keep a 40px hit area inside the pill.",
    "The full checksummed address is in the label's tooltip. Copy always copies the full address, even when a name is shown.",
    "The loading state is a labelled status, and its pulse stops with reduced motion.",
  ],
  notes: [
    "Addresses are EIP-55 checksummed with viem before display, so mixed-case input renders consistently.",
    "The avatar is a gradient generated from the address bytes, so the same address gets the same avatar everywhere. Pass avatarUrl to show an ENS or profile image instead.",
  ],
};
