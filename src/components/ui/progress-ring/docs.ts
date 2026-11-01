import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ProgressRing } from "@/components/ui/progress-ring/progress-ring";

export function Upload({ percent }: { percent: number }) {
  return <ProgressRing value={percent} label="Upload progress" />;
}

// Custom range and label
<ProgressRing value={58} max={128} label="Photos storage" formatValue={(v) => \`\${Math.round(v)} GB\`} />`,
  a11y: [
    "A real progressbar: aria-valuenow, aria-valuemax and a readable aria-valuetext (e.g. “58 GB”).",
    "The counting label is aria-hidden; screen readers get the final value from the progressbar.",
    "With reduced motion enabled, the ring and label jump straight to the value.",
  ],
  notes: [
    "One Motion value drives both the stroke and the label, so they always agree.",
    "The track is a light step of the fill color, so the remaining part still reads as the same meter. Use the fill color for severity (accent → warning → danger).",
    "At small sizes, set showValue={false} and show the value next to it.",
  ],
};
