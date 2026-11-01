import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FeatureBento } from "@/components/ui/feature-bento/feature-bento";

// Sensible defaults out of the box:
<FeatureBento />

// Or bring your own tiles:
<FeatureBento
  title="Plays well with your stack"
  features={[{ title: "Sync", description: "Both ways.", visual: <MyVisual />, className: "@[48rem]:col-span-2" }]}
/>`,
  a11y: [
    "The section title and tile titles form a proper heading outline; set headingLevel to fit your page.",
    "Default tiles keep their interactions accessible: switches have visible labels, the sparkline is labelled and the rings expose their values.",
    "Every default visual respects reduced motion through its own component (no draw-on, typing or ring sweeps).",
  ],
  notes: [
    "The defaults reuse Sparkline, Number Ticker, Spring Switch, Typewriter, Activity Rings and Shimmer Text, so they install with it.",
    "The grid goes from one to two to three columns with container queries; give a tile @[48rem]:col-span-2 to make it wide.",
  ],
};
