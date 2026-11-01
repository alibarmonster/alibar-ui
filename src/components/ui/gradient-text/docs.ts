import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { GradientText } from "@/components/ui/gradient-text/gradient-text";

export function Hero() {
  return (
    <h1 className="text-5xl font-semibold">
      Interfaces that feel <GradientText>alive</GradientText>
    </h1>
  );
}`,
  a11y: [
    "Pick colors with at least 4.5:1 contrast against the background (3:1 for large headings), since the text is drawn in every stop. The defaults all clear 4.5:1 on white.",
    "In forced-colors (high contrast) mode the gradient is dropped and the text uses the system text color.",
    "With reduced motion enabled, the gradient holds still.",
  ],
  notes: [
    "The wash moves by animating background-position, which only repaints the glyphs and never triggers layout. It's the one effect here that can't be done with transforms alone, so keep it to a heading or a phrase.",
    "Two copies of the palette across a 200%-wide background make the loop seamless.",
  ],
};
