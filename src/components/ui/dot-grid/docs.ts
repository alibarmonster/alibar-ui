import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DotGrid } from "@/components/ui/dot-grid/dot-grid";

export function Hero() {
  return (
    <DotGrid className="h-96">
      <h1>Build on a quiet grid</h1>
    </DotGrid>
  );
}`,
  a11y: [
    "The canvas is decorative and aria-hidden; content goes in children, above it.",
    "Pointer-driven only: nothing moves on its own. With reduced motion enabled, dots respond without easing.",
  ],
  notes: [
    "Drawn on a canvas at device-pixel resolution. Resting dots are batched into one path, and the draw loop runs only while dots are easing, then stops.",
    "Colors accept any CSS color, including var() and color-mix(), and follow your theme tokens.",
    "Size it with className (the grid fills the element and stays centered).",
  ],
};
