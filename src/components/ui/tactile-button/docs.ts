import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TactileButton } from "@/components/ui/tactile-button/tactile-button";

export function Launch() {
  return <TactileButton variant="primary">Launch</TactileButton>;
}`,
  a11y: [
    "Renders a native button. The keycap sinks for Space and Enter as well as the pointer.",
    "The edge and ground shadow are decorative and aria-hidden; only the label is announced.",
    "The button reserves `depth` px of margin below itself, so the edge never overlaps the next element.",
    "With reduced motion enabled, the press and release are instant instead of springing.",
  ],
  notes: [
    "Pass `pressed` to drive the look from outside, for example to mirror physical keys as in the Keycaps example.",
    "Edge colors are mixed from your --foreground and --primary tokens, so the keycap follows your theme.",
  ],
};
