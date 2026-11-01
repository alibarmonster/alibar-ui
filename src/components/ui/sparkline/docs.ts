import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Sparkline } from "@/components/ui/sparkline/sparkline";

export function Row() {
  return <Sparkline data={[142, 148, 151, 158, 163, 170]} label="Northwind, 6 weeks" showChange />;
}`,
  a11y: [
    "Exposed as an image whose name summarises the series: first and last value, the change, and the low and high.",
    "The change badge pairs color with an arrow icon and a signed number, so direction never depends on color alone; its color follows goodDirection (for latency or errors, down is good).",
    "With reduced motion enabled, the line appears without drawing on.",
  ],
  notes: [
    "Follows the chart spec: a 2px line, a 10% wash, and an end dot with a 2px ring in the surface color.",
    "The draw-on is a clip-path reveal, and hovering shows the nearest point's value (and label, if you pass labels).",
    "Fixed size by design (width and height props); for a full-width trend use the Area Chart.",
  ],
};
