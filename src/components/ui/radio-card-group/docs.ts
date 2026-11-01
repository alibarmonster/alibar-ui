import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card-group/radio-card-group";

export function PlanPicker() {
  return (
    <RadioCardGroup defaultValue="pro" aria-label="Plan" className="sm:grid-cols-3">
      <RadioCard value="starter" title="Starter" aside="$0" />
      <RadioCard value="pro" title="Pro" aside="$24" />
      <RadioCard value="scale" title="Scale" aside="$79" />
    </RadioCardGroup>
  );
}`,
  a11y: [
    "Built on Radix RadioGroup: role=\"radiogroup\" with one tab stop, and arrow keys move between cards and select them.",
    "Each card is a radio whose accessible name is its title and description. Give the group an aria-label or wrap it in a labelled fieldset.",
    "Disabled cards are skipped by the arrow keys.",
    "With a name inside a form, Radix submits the selected value through a hidden input.",
    "With reduced motion enabled, the ring and dot jump to the chosen card without gliding or bouncing.",
  ],
  notes: [
    "Lay the cards out with className on the group, e.g. sm:grid-cols-3; the shared ring follows any layout.",
    "The gliding ring has an inline 14px radius so Motion can keep its corners round while it moves.",
  ],
};
