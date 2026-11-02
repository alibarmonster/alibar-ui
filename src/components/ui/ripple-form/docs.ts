import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RippleForm } from "@/components/ui/ripple-form/ripple-form";

<RippleForm
  title="Join the waitlist"
  onSubmit={async ({ name, email, updates }) => {
    await joinWaitlist({ name, email, updates });
  }}
/>`,
  a11y: [
    "The form is real DOM inside the canvas, so labels, the tab order, autofill, validation and screen readers work as usual. Its geometry is synced to where it is drawn, so clicks and text selection land on the drawn fields.",
    "Ripples fade out around the focused input, so the text being typed is never distorted. Errors are announced with role=\"alert\" and success with role=\"status\".",
    "With reduced motion, or without the HTML-in-Canvas API, the same form renders as plain DOM; only the button keeps a small CSS ripple (none under reduced motion).",
  ],
  notes: [
    "Experimental: uses the HTML-in-Canvas origin trial through src/lib/html-canvas/, never the API directly. Works in every browser via the fallback.",
    "The form texture is re-uploaded only when the browser reports a repaint (typing, focus, hover), and the frame loop runs only while ripples are fading.",
    "Ripples are evaluated analytically in the fragment shader (up to 10 at once), so there is no simulation state to keep.",
  ],
};
