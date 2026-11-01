import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AuroraBackground } from "@/components/ui/aurora-background/aurora-background";

export function Hero() {
  return (
    <AuroraBackground className="flex h-[32rem] items-center justify-center">
      <h1>Interfaces with a little weather in them</h1>
    </AuroraBackground>
  );
}`,
  a11y: [
    "Decorative and aria-hidden; content in children keeps its own contrast against white.",
    "With reduced motion enabled, the blobs hold still.",
  ],
  notes: [
    "Blobs are soft radial gradients rather than blurred shapes, so they're cheap to paint, and only transforms animate, on long offset loops.",
    "Designed for light backgrounds: blobs multiply onto white. Pass up to four light colors, and use `speed` and `intensity` to tune it.",
  ],
};
