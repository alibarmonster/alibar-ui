import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RangeSlider } from "@/components/ui/range-slider/range-slider";

export function PriceFilter() {
  const [range, setRange] = useState([200, 750]);
  return (
    <RangeSlider
      aria-label="Price range"
      thumbLabels={["Minimum price", "Maximum price"]}
      value={range}
      onValueChange={setRange}
      max={1000}
      step={50}
    />
  );
}`,
  a11y: [
    "Each thumb has role=\"slider\" with aria-valuenow, aria-valuemin, aria-valuemax and an aria-valuetext built from formatValue.",
    "Arrow keys move one step, PageUp and PageDown move about a tenth of the range, and Home and End jump to the bounds.",
    "In range mode the thumbs are labelled (\"Minimum\", \"Maximum\" or thumbLabels) and each one's bounds follow the other, so they never cross.",
    "Clicking the track moves the nearest thumb and focuses it, so the keyboard picks up where the pointer left off.",
    "With reduced motion enabled, the thumb jumps to each step instead of springing.",
  ],
  notes: [
    "Pass one value for a single thumb or two for a range.",
    "The thumb rides a full-width layer translated by a percentage, and the fill is a clip-path, so dragging never animates layout.",
    "Ticks appear automatically for 20 steps or fewer. Set ticks to force them on or off.",
  ],
};
