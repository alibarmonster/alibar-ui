import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DissolveTransition } from "@/components/ui/dissolve-transition/dissolve-transition";

<DissolveTransition contentKey={tab} mode="pixel">
  <TabPanel tab={tab} />
</DissolveTransition>`,
  a11y: [
    "Only the incoming content is interactive and in the accessibility tree; the outgoing copy is inert and aria-hidden while it dissolves, and is removed when the transition ends.",
    "The incoming content's geometry is synced to where it is drawn, so focus, clicks and text selection work during and after the swap.",
    "With reduced motion, or without the HTML-in-Canvas API, content crossfades with a blur (a plain fade under reduced motion).",
  ],
  notes: [
    "Experimental: uses the HTML-in-Canvas origin trial through src/lib/html-canvas/. Works in every browser via the fallback.",
    "The outgoing content is captured once, after the browser has painted it; only the incoming texture updates while you interact with it. The frame loop runs only during a transition.",
    "Change `contentKey` to transition. Changing children with the same key updates the content in place without a dissolve.",
  ],
};
