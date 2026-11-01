import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SpringPressButton } from "@/components/ui/spring-press-button/spring-press-button";

export function Hero() {
  return <SpringPressButton size="lg">Get started</SpringPressButton>;
}`,
  a11y: [
    "Renders a native button, so Tab, Enter and Space work as expected.",
    "The press state follows Space and Enter as well as the pointer, so keyboard users get the same feedback.",
    "Releasing the pointer outside the button, or moving focus away, always releases the press.",
    "With reduced motion enabled, the scale is replaced by a brief dim.",
  ],
  notes: [
    "Press-in uses the snappy spring; release uses the spring named by `release`, so the button settles with a little life.",
  ],
};
