import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ParticleField } from "@/components/ui/particle-field/particle-field";

export function Hero() {
  return (
    <ParticleField className="h-96">
      <h1>Everything is connected</h1>
    </ParticleField>
  );
}`,
  a11y: [
    "The canvas is decorative and aria-hidden.",
    "With reduced motion enabled, particles are drawn once and hold still.",
  ],
  notes: [
    "Particles drift slowly, get pushed away by the cursor, and ease back to their own drift. Nearby particles are linked by faint lines.",
    "The simulation pauses while offscreen. Density is per area (capped at 180 particles), so larger fields get more particles.",
    "Colors accept any CSS color, including theme variables.",
  ],
};
