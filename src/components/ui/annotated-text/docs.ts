import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AnnotatedText } from "@/components/ui/annotated-text/annotated-text";

export function Pitch() {
  return (
    <p>
      Ship <AnnotatedText>components</AnnotatedText> that feel{" "}
      <AnnotatedText type="highlight" delay={0.6}>handcrafted</AnnotatedText>.
    </p>
  );
}`,
  a11y: [
    "Marks are a decorative, aria-hidden SVG; the text inside is untouched. If the emphasis carries meaning, wrap the text in <strong>, <mark> or <s> as well.",
    "With reduced motion enabled, marks fade in instead of being drawn.",
  ],
  notes: [
    "Underline, highlight and strike follow each line when the text wraps; circle, box and bracket surround the whole text. Shapes are re-measured when fonts load or the container resizes.",
    "Strokes draw with pathLength (stroke-dashoffset on a small SVG); the highlight marker sweeps open with scaleX.",
    "The wobble is seeded per instance, so a mark keeps its shape across re-renders. Chain several annotations by staggering `delay`.",
  ],
};
