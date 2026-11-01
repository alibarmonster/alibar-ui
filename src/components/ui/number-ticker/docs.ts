import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { NumberTicker } from "@/components/ui/number-ticker/number-ticker";

export function Stat() {
  return <NumberTicker value={12480} suffix="+" className="text-4xl font-semibold" />;
}

// Currency, compact
<NumberTicker value={1284000} format={{ style: "currency", currency: "USD", notation: "compact" }} />`,
  a11y: [
    "Screen readers read the final value from a visually hidden copy; the counting digits are aria-hidden, so intermediate numbers are never announced.",
    "If the value updates live and should be announced, wrap it in your own aria-live region.",
    "With reduced motion enabled, the final number appears immediately.",
  ],
  notes: [
    "Counting runs on a Motion value written straight to the DOM, so it never re-renders React.",
    "An invisible copy of the final value reserves the space: counting never shifts the layout. Large standalone numbers use proportional figures, which read better than tabular ones at display sizes.",
    "Changing `value` counts on from the number on screen, not from `from`.",
  ],
};
