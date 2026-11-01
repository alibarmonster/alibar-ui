import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BarsLoader } from "@/components/ui/bars-loader/bars-loader";

<BarsLoader />

// As a "now playing" indicator
<BarsLoader playing={isPlaying} label={isPlaying ? "Playing" : "Paused"} />`,
  a11y: [
    "A status element with an accessible label; the bars are aria-hidden. Update `label` when the meaning changes (Playing / Paused).",
    "With reduced motion enabled, bars hold still and gently fade.",
  ],
  notes: [
    "Each bar follows its own hand-tuned rhythm, so neighbors never move in lockstep. Bars grow from the bottom with scaleY only.",
    "playing={false} settles the bars low, like paused audio. Uses currentColor.",
  ],
};
