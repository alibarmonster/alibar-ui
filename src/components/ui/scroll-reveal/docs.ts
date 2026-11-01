import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ScrollReveal } from "@/components/ui/scroll-reveal/scroll-reveal";

export function Article() {
  return (
    <ScrollReveal className="space-y-8">
      <h2>Designing motion people don't notice</h2>
      <p>…</p>
      <img src="/figure.jpg" alt="…" />
    </ScrollReveal>
  );
}`,
  a11y: [
    "Content is real, in-order markup; only its appearance animates. The progress bar is decorative and aria-hidden.",
    "With reduced motion enabled, blocks fade in without blur or movement, and the bar tracks scroll directly.",
  ],
  notes: [
    "Each direct child reveals on its own as it enters view (blur, fade and a short rise), once by default.",
    "The bar is pinned to the top of the section and fills from the moment the section reaches the top until its end reaches the bottom.",
    "Pass `container` when the section scrolls inside an element rather than the page, and make that element positioned (e.g. relative); otherwise the section's position is measured from the wrong ancestor and the bar lags.",
  ],
};
