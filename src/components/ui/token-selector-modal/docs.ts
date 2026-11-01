import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TokenSelectorModal } from "@/components/ui/token-selector-modal/token-selector-modal";

<TokenSelectorModal
  trigger={<button>Select token</button>}
  tokens={tokens} // { symbol, name, decimals, price?, iconUrl? }[]
  balances={{ ETH: ethBalance, USDC: usdcBalance }}
  popular={["ETH", "USDC", "USDT"]}
  selected="ETH"
  disabledSymbol="USDC" // e.g. the other side of a swap
  onSelect={(token) => setToken(token)}
/>`,
  a11y: [
    "The search field is a combobox that controls the token listbox: arrow keys move the active option (aria-activedescendant), Enter picks, and focus never leaves the field.",
    "Built on Radix Dialog: focus starts in the search, stays trapped and returns to the trigger on close; Escape closes.",
    "Popular chips are toggle buttons; the token on the other side of a trade is disabled rather than hidden.",
    "Rows fade up with a short stagger. Reduced motion uses a plain fade and stops the loading pulse.",
  ],
  notes: [
    "Tokens with a balance sort first by USD value (bigint math), then alphabetically. Pasting an exact address matches it too.",
  ],
};
