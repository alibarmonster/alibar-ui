import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AnimatedCheckbox } from "@/components/ui/animated-checkbox/animated-checkbox";

export function Terms() {
  return (
    <div className="flex items-center gap-3">
      <AnimatedCheckbox id="terms" />
      <label htmlFor="terms">Accept terms and conditions</label>
    </div>
  );
}`,
  a11y: [
    "Built on Radix Checkbox: role=\"checkbox\", aria-checked (\"mixed\" when indeterminate) and Space to toggle.",
    "Inside a form with a name, Radix renders a hidden native input, so it submits like a real checkbox.",
    "Every size extends its hit area to about 40px; pair it with a <label htmlFor> for a larger target.",
    "With reduced motion enabled, the check and fill appear instantly.",
  ],
  notes: [
    "The check stroke draws on with pathLength; unchecking reverses it quickly so the state change reads at a glance.",
    "Use \"indeterminate\" for a parent checkbox whose children are partly selected, as in the Select all example.",
  ],
};
