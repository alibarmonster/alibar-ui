import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AccountDropdown } from "@/components/ui/account-dropdown/account-dropdown";

<AccountDropdown
  address={account.address}
  name={ensName}
  balance={totalUsdValue} // bigint with 8 decimals
  chain={{ id: 1, name: "Ethereum", explorerUrl: "https://etherscan.io" }}
  onDisconnect={disconnect}
/>`,
  a11y: [
    "The trigger is named after the account and opens a Radix dropdown menu with arrow-key navigation and typeahead.",
    "Copy address keeps the menu open and confirms with a check and a polite \"Address copied\" message.",
    "The rolling balance renders its full value as screen-reader text; the digit reels are aria-hidden.",
    "Reduced motion keeps balance updates to a color change, with no rolling reels or highlight.",
  ],
  notes: [
    "Balances are bigint values formatted as strings, so nothing is ever converted to a float. Increases flash green and decreases flash red.",
    "The trigger hides the balance below the sm breakpoint to keep the address readable on phones.",
  ],
};
