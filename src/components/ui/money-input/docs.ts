import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MoneyInput } from "@/components/ui/money-input/money-input";

export function TransferAmount() {
  const [amount, setAmount] = useState<number | null>(null);
  return <MoneyInput aria-label="Amount" currency="IDR" locale="id-ID" value={amount} onValueChange={setAmount} />;
}`,
  a11y: [
    "The field is a real text input with inputMode=\"decimal\" (or \"numeric\" for whole-unit currencies), so mobile keyboards show digits.",
    "Screen readers read the formatted value from the input itself; the animated digits are an aria-hidden copy.",
    "The currency symbol is decorative. Give the field a label or aria-label that names the currency if it is not obvious.",
    "The caret stays next to the digit you typed even when separators are inserted or removed.",
    "With reduced motion enabled, digits fade in place instead of rolling.",
  ],
  notes: [
    "Separators, symbol and symbol position come from Intl.NumberFormat, so any locale and ISO 4217 currency works.",
    "IDR defaults to whole rupiah. Pass fractionDigits to override any currency.",
    "Pass name to submit the plain number (e.g. 1250.5) through a hidden input.",
  ],
};
