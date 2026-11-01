import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FaqSection } from "@/components/ui/faq-section/faq-section";

<FaqSection items={[{ question: "Do I need a package?", answer: "No, you copy the code." }]} />`,
  a11y: [
    "The search field is labelled and controls the list; the number of matches is announced politely as you type.",
    "Questions use Bouncy Accordion, so each is a heading with a button (aria-expanded) and full keyboard support.",
    "Filtering animates the list's height with a layout animation; reduced motion swaps results with a plain fade.",
  ],
  notes: [
    "Search matches questions, plus answers that are plain strings. Reuses Bouncy Accordion, so it installs with it.",
  ],
};
