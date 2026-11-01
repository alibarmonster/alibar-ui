import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RollingDigits } from "@/components/ui/rolling-digits/rolling-digits";

export function Price({ value }: { value: number }) {
  return <RollingDigits value={value} decimals={2} format={{ style: "currency", currency: "USD" }} />;
}`,
  a11y: [
    "The formatted number is in a visually hidden copy for screen readers (and for copy and paste); the reels are aria-hidden.",
    "Announce live changes with your own aria-live region if they matter.",
    "With reduced motion enabled, digits change instantly.",
  ],
  notes: [
    "Each reel is a column of 0–9 moved with transforms only. Reels are keyed by place value from the right, so 999 → 1,000 keeps the ones reel in place and rolls a new thousands digit in.",
    "Uses tabular figures so reels line up; the reel window fades at its edges with a mask instead of overflow clipping, which keeps the text baseline intact.",
  ],
};
