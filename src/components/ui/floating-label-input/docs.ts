import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FloatingLabelInput } from "@/components/ui/floating-label-input/floating-label-input";

export function EmailField() {
  return <FloatingLabelInput label="Email address" type="email" autoComplete="email" />;
}`,
  a11y: [
    "Uses a real <label> tied to the input, so the label is the accessible name and clicking it focuses the field.",
    "Description and error text are linked with aria-describedby; the error also sets aria-invalid and is announced politely.",
    "The floating state is pure CSS (:focus-within, :placeholder-shown and :autofill), so it is correct before hydration and with browser autofill.",
    "The float animates only transform. With reduced motion enabled the label and notch move instantly; only the color fades.",
  ],
  notes: [
    "className styles the outer wrapper so you can size the field; all other props go to the input.",
    "The notch is a fieldset legend sized to the floated label, so it works on any background, not just white.",
    "A placeholder, if given, only appears while the field is focused, so it never collides with the label.",
  ],
};
