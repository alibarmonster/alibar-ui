import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern/animated-grid-pattern";

<AnimatedGridPattern className="h-96">
  <YourHero />
</AnimatedGridPattern>`,
  a11y: [
    "The pattern is a decorative SVG (aria-hidden); children render above it.",
    "With reduced motion the lit squares rest at half opacity and don't move around.",
  ],
  notes: [
    "Grid lines are a single SVG pattern. Lit squares fade in and out with staggered starts, and each one reappears somewhere new when its fade ends.",
    "Square positions come from a seeded PRNG, and the grid size follows the container through a ResizeObserver.",
  ],
};
