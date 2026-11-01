import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ResolutionCard } from "@/components/ui/resolution-card/resolution-card";

<ResolutionCard
  market={market} // rules, resolutionSource, endsAt, resolvedOutcomeId
  stage="resolving"
  disputeEndsAt={Date.UTC(2026, 10, 6, 18)}
/>`,
  a11y: [
    "The timeline is an ordered list; the current step has aria-current=\"step\" and every step is labelled in text.",
    "The Rules toggle reports aria-expanded, and the collapsed content is inert so it is skipped by Tab.",
    "The dispute countdown has a full spoken label (\"2 days, 4 hours, 10 minutes\"); the final outcome is plain text inside the stamp.",
    "With reduced motion the pulse, drawn checks, stamp and border glow are skipped.",
  ],
  notes: [
    "Stages: open → closed → resolving → resolved. Moving to resolved draws the remaining checks, stamps the winning outcome and briefly glows the border.",
    "Dates use a fixed en-US format in UTC and render after hydration, as does the countdown (from a shared 15-second clock).",
  ],
};
