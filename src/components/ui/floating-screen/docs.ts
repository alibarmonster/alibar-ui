import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FloatingScreen } from "@/components/ui/floating-screen/floating-screen";

<FloatingScreen device="laptop">
  <MiniDashboard />
</FloatingScreen>`,
  a11y: [
    "The app on the screen is live DOM with its own semantics and tab order. Its geometry is synced through the same perspective matrix it is drawn with, so clicks, focus rings and text selection land on the tilted screen.",
    "Tilting follows a mouse or pen only, never touch, so phones scroll normally. The device body is decorative.",
    "With reduced motion the device does not tilt; without the HTML-in-Canvas API the same device is built from CSS 3D transforms, which keep clicks working natively.",
  ],
  notes: [
    "Experimental: uses the HTML-in-Canvas origin trial through src/lib/html-canvas/. Works in every browser via the fallback.",
    "The screen texture is uploaded only when the app repaints; tilting only redraws, and the frame loop runs only while the tilt eases toward the pointer.",
    "The laptop screen is 440 × 276 px and the phone 210 × 430 px; build the app for that size (it is clipped to it).",
  ],
};
