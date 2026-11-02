import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay/liquid-glass-overlay";

<LiquidGlassOverlay
  toolbar={<><button aria-label="Bold">B</button><button aria-label="Italic">I</button></>}
>
  <Article />
</LiquidGlassOverlay>`,
  a11y: [
    "The glass is a labelled role=\"toolbar\" of real buttons. Its grip is a button that moves the glass with the arrow keys (Shift for bigger steps).",
    "The content beneath stays live: text can be selected and links followed around and under the glass, since only the glass's own buttons sit on top.",
    "With reduced motion, or without the HTML-in-Canvas API, the glass is a backdrop-filter blur with a gradient rim and stays draggable.",
  ],
  notes: [
    "Experimental: uses the HTML-in-Canvas origin trial through src/lib/html-canvas/. Works in every browser via the fallback.",
    "Refraction happens only in a band along the rim (shaped by the glass's signed distance field), with red bent a little more than blue; the middle is tinted but undistorted so it stays readable.",
    "Moving the glass only redraws; the content and toolbar textures are re-uploaded only when they repaint.",
  ],
};
