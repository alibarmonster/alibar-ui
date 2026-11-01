import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TokenAmountInput } from "@/components/ui/token-amount-input/token-amount-input";

const [value, setValue] = useState("");

<TokenAmountInput
  label="You pay"
  token={{ symbol: "ETH", decimals: 18, price: ethPrice }}
  balance={balance} // bigint in wei
  value={value}
  onValueChange={(text, amount) => setValue(text)} // amount: bigint | null
  onTokenClick={() => setSelectorOpen(true)}
/>`,
  a11y: [
    "The visible label is tied to the input, which uses inputMode=\"decimal\" for a numeric keypad on phones.",
    "Going over your balance sets aria-invalid, links an alert with the error and shakes the field once. Reduced motion skips the shake.",
    "Percentage chips are toggle buttons (aria-pressed) with 40px hit areas; the token button names the selected token.",
    "While loading, the field is aria-busy and its value is replaced by a pulse that stops with reduced motion.",
  ],
  notes: [
    "Input is sanitized as you type (digits and one decimal point, commas become points) and trimmed to the token's decimals. onValueChange gives you the parsed bigint, so you never parse floats.",
    "Chips compute exact amounts with bigint math; Max uses the full balance with every decimal.",
  ],
};
