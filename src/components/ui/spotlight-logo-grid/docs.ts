import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SpotlightLogoGrid } from "@/components/ui/spotlight-logo-grid/spotlight-logo-grid";

<SpotlightLogoGrid items={[{ name: "Acme", logo: <AcmeLogo />, href: "/customers/acme" }]} columns={4} />`,
  a11y: [
    "Logos are links with hidden names, or labelled images when there's no href; the glow is decorative.",
    "Keyboard focus moves the glow to the focused cell, so the effect isn't pointer-only.",
    "With reduced motion the glow appears and disappears without fading. It never moves on its own, only with the pointer.",
  ],
  notes: [
    "A radial gradient sits under the cells and shows only through the 1px gaps, so just the hairlines near the cursor light up.",
    "Pointer coordinates are written to CSS variables in requestAnimationFrame: moving the mouse never re-renders React.",
  ],
};
