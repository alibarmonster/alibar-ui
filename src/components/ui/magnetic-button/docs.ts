import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MagneticButton } from "@/components/ui/magnetic-button/magnetic-button";

export function Cta() {
  return <MagneticButton size="lg">Book a demo</MagneticButton>;
}`,
  a11y: [
    "Renders a native button; the magnetic movement is purely visual and never changes the focus order or hit target.",
    "Magnetism only runs for a mouse on devices that support hover. Touch and pen users get a regular button.",
    "With reduced motion enabled, the button stays still and pressing dims it instead of scaling.",
  ],
  notes: [
    "The pull fades in with a smoothstep curve from the edge of `radius`, so the button never jumps when the cursor enters the field.",
    "One passive, rAF-throttled pointermove listener is added per button and removed on unmount.",
  ],
};
