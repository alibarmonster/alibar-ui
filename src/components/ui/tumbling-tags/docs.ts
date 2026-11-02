import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TumblingTags } from "@/components/ui/tumbling-tags/tumbling-tags";

<TumblingTags
  tags={[
    { label: "Credit", tone: "ember" },
    { label: "Savings + Investment", tone: "ink" },
    { label: "Cards", tone: "sand" },
    { label: "Accounts", tone: "ink" },
    { label: "Payments", tone: "mint" },
  ]}
/>`,
  a11y: [
    "The blocks are a labelled group of real text; with `href` they become links in reading order (bottom of the pile first). Ghost blocks are aria-hidden.",
    "Under reduced motion the blocks fade into their resting places without falling or tumbling.",
  ],
  notes: [
    "The pile is laid out in rows of 2, 1, 2… blocks from the floor up; higher rows tilt more. Each block falls from above with its own spin and lands on a bouncy spring, floor first.",
    "Blocks drop when the group scrolls into view; change `replayKey` to drop them again.",
    "Tones: ink, mint, sand and ember, or pass `{ background, color }`.",
  ],
};
