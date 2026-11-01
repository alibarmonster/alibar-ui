import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BlurRevealText } from "@/components/ui/blur-reveal-text/blur-reveal-text";

export function Manifesto() {
  return (
    <BlurRevealText
      as="h2"
      className="text-3xl font-semibold"
      text="Good motion is invisible."
    />
  );
}`,
  a11y: [
    "Screen readers read the whole text from a visually hidden copy, not word by word, and the animated words are aria-hidden.",
    "With reduced motion enabled, words fade in without blur or movement, twice as fast.",
  ],
  notes: [
    "Whitespace stays as plain text between words, so lines wrap exactly as they would without the effect.",
    "The stagger is capped so the whole reveal finishes in about 1.6s, however long the text. Each word drops its filter once settled.",
    "Uses IntersectionObserver, so it also works inside scroll containers.",
  ],
};
