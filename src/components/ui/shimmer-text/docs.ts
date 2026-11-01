import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ShimmerText } from "@/components/ui/shimmer-text/shimmer-text";

export function Thinking({ done }: { done: boolean }) {
  return <ShimmerText active={!done}>Searching the docs</ShimmerText>;
}`,
  a11y: [
    "The text stays real, readable text; the moving highlight is an aria-hidden copy.",
    "Pair it with a status region (role=\"status\" or aria-live) when the text itself changes, so progress is announced.",
    "With reduced motion enabled, the sweep becomes a gentle opacity breathe with no movement.",
  ],
  notes: [
    "Transform-only: a narrow masked window slides across while the copy inside it slides back by the same amount. No background-position animation, so the sweep stays on the compositor.",
    "Designed for a single line. Set the base color with className (default text-muted-foreground) and the band color with highlightClassName.",
  ],
};
