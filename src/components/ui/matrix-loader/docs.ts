import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MatrixLoader } from "@/components/ui/matrix-loader/matrix-loader";

<MatrixLoader pattern="spiral" label="Generating image" />`,
  a11y: [
    "A status element with an accessible label (default “Loading”); the dots are aria-hidden.",
    "With reduced motion enabled, dots fade slowly instead of scaling.",
  ],
  notes: [
    "Sixteen dots light up in one of five orders: wave, diagonal, spiral, pulse or rain. Only opacity and scale animate.",
    "Uses currentColor; size it with dotSize and gap.",
  ],
};
