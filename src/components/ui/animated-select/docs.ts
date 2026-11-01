import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AnimatedSelect } from "@/components/ui/animated-select/animated-select";

export function FrameworkField() {
  const [framework, setFramework] = useState("next");
  return (
    <AnimatedSelect
      aria-label="Framework"
      value={framework}
      onValueChange={setFramework}
      options={[
        { value: "next", label: "Next.js" },
        { value: "remix", label: "Remix" },
      ]}
    />
  );
}`,
  a11y: [
    "The trigger follows the select-only combobox pattern (role=\"combobox\", aria-expanded), so screen readers announce its label and current value.",
    "In the list, arrow keys move the highlight, Home and End jump, Enter (or Space without a filter) chooses, and Escape closes; focus returns to the trigger.",
    "Without a filter field, typing letters jumps to the first matching option; with searchable, the field filters as you type.",
    "Disabled options are announced as unavailable and skipped by the arrow keys.",
    "With reduced motion enabled, the list fades instead of scaling and the highlight jumps between rows.",
  ],
  notes: [
    "The list scales from the trigger using Radix's --radix-popover-content-transform-origin, so it grows from the right edge when flipped above or below.",
    "The list matches the trigger width, with a 12rem minimum.",
    "Pass name to submit the value through a hidden input.",
  ],
};
