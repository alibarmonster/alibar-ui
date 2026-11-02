import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SpendMeter } from "@/components/ui/spend-meter/spend-meter";

<SpendMeter
  resources={[
    { id: "inference", name: "Model inference", amount: 3124, detail: "1.8M tokens across 3 models" },
    { id: "tools", name: "Tool calls", amount: 1606, detail: "4,212 calls to 18 tools" },
    { id: "storage", name: "Knowledge storage", amount: 850 },
  ]} // cents
  defaultBudget={10000} // $100
  onBudgetChange={(budget) => saveLimit(budget)}
  periodLabel="November 2026"
/>`,
  a11y: [
    "The meter is a role=\"meter\" with the total, the limit and the percentage in its value text. Every segment has a matching row with its name and amount, so color is never the only cue.",
    "The limit stepper is a labelled group of two buttons; each change is announced politely, and the buttons disable at the minimum and maximum.",
    "\"Approaching limit\" and \"Limit reached\" are written out, not only shown in amber or red. With reduced motion, segments and numbers change without travel.",
  ],
  notes: [
    "All money is integer minor units (cents, or sen for IDR) and is only divided by 100 for display. `step`, `min` and `max` use the same units, so the default step of 2500 is $25.",
    "Under 75% of the limit the card is neutral, from 75% it turns amber, and at 100% it turns red; spend past the limit rescales the meter and hatches the overflow.",
    "Segment colors come from the shared category tokens (--chart-1 to --chart-6), in the order the resources are passed.",
  ],
};
