import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SegmentedControl } from "@/components/ui/segmented-control/segmented-control";

export function RangePicker() {
  const [range, setRange] = useState("week");
  return (
    <SegmentedControl
      aria-label="Date range"
      value={range}
      onValueChange={setRange}
      options={[
        { value: "day", label: "Day" },
        { value: "week", label: "Week" },
        { value: "month", label: "Month" },
      ]}
    />
  );
}`,
  a11y: [
    "Built on Radix RadioGroup: one tab stop, and the arrow keys move the selection, as users expect from a segmented control.",
    "Icon-only segments need an aria-label in their option; the icon itself should be aria-hidden.",
    "Give the control an aria-label that names what it changes, e.g. \"Date range\".",
    "With reduced motion enabled, the pill jumps instead of sliding.",
  ],
  notes: [
    "Use a segmented control for a handful of mutually exclusive views. For more than five options, prefer a select.",
  ],
};
