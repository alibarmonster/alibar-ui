import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ShimmerButton } from "@/components/ui/shimmer-button/shimmer-button";

export function Upgrade() {
  return <ShimmerButton>Upgrade to Pro</ShimmerButton>;
}`,
  a11y: [
    "Renders a native button; the sweep is a decorative, aria-hidden layer behind the label.",
    "In hover mode the sweep also plays on keyboard focus, so keyboard users see the same cue.",
    "The loop pauses while the button is off-screen and never runs with reduced motion enabled.",
  ],
  notes: [
    "The sweep only animates transform, so it stays on the compositor even when looping.",
    "Keep loops for a single primary call to action per view; several shimmering buttons compete for attention.",
  ],
};
