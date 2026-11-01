import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { QuantityStepper } from "@/components/ui/quantity-stepper/quantity-stepper";

export function CartItem() {
  const [quantity, setQuantity] = useState(1);
  return <QuantityStepper value={quantity} onValueChange={setQuantity} min={1} max={10} />;
}`,
  a11y: [
    "The number is a focusable spinbutton with aria-valuenow, aria-valuemin and aria-valuemax.",
    "Arrow keys step, PageUp and PageDown take larger steps, and Home and End jump to the bounds.",
    "The −/+ buttons are labelled (e.g. \"Increase quantity\") and kept out of the tab order, following the WAI-ARIA spinbutton pattern.",
    "At a bound the button is aria-disabled rather than disabled, so focus is never lost, and the number nudges to signal the limit.",
    "With reduced motion enabled, digits cross-fade instead of rolling and there is no nudge.",
  ],
  notes: [
    "Press and hold either button to repeat; the rate speeds up the longer it is held.",
    "Each digit place rolls on its own, so going from 99 to 100 only animates the places that changed.",
  ],
};
